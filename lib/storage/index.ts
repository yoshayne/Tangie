import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

/**
 * File storage. In production this is the Railway Storage Bucket (S3 API, private).
 * Locally, if no BUCKET_* variables are set, files go to ./.local-media so development
 * and tests need no cloud account. Production without a bucket is a hard error.
 */

export type StoredObject = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  etag?: string;
  status: 200 | 206;
};

const MIME_BY_EXT: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  pdf: "application/pdf",
  zip: "application/zip",
};

export function mimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

function bucketConfig() {
  const bucket = process.env.BUCKET_NAME;
  if (!bucket) return null;
  const endpoint = process.env.BUCKET_ENDPOINT;
  const accessKeyId = process.env.BUCKET_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "BUCKET_NAME is set but BUCKET_ENDPOINT / BUCKET_ACCESS_KEY_ID / BUCKET_SECRET_ACCESS_KEY are missing",
    );
  }
  return {
    bucket,
    client: new S3Client({
      endpoint,
      region: process.env.BUCKET_REGION || "auto",
      credentials: { accessKeyId, secretAccessKey },
      // Railway buckets use virtual-hosted style; older ones may need path style.
      forcePathStyle: process.env.BUCKET_PATH_STYLE === "true",
    }),
  };
}

let cached: ReturnType<typeof bucketConfig> | undefined;
function s3() {
  if (cached === undefined) cached = bucketConfig();
  return cached;
}

const LOCAL_DIR = path.resolve(process.cwd(), ".local-media");

function localPath(key: string) {
  const full = path.resolve(LOCAL_DIR, key);
  if (!full.startsWith(LOCAL_DIR + path.sep)) throw new Error("Bad key");
  return full;
}

function requireDriver() {
  const driver = s3();
  // Local disk is for development and tests only. Set ALLOW_LOCAL_MEDIA=true to use it with `next start`.
  if (
    !driver &&
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_LOCAL_MEDIA !== "true"
  ) {
    throw new Error("BUCKET_* variables are not set");
  }
  return driver;
}

export function storageDriverName(): "bucket" | "local" {
  return s3() ? "bucket" : "local";
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const driver = requireDriver();
  if (driver) {
    await driver.client.send(
      new PutObjectCommand({
        Bucket: driver.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return;
  }
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

/** Streams a large file (video, PDF) into storage without holding it all in memory. */
export async function putObjectStream(
  key: string,
  body: Readable,
  contentType: string,
): Promise<void> {
  const driver = requireDriver();
  if (driver) {
    await new Upload({
      client: driver.client,
      params: {
        Bucket: driver.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
      queueSize: 3,
      partSize: 8 * 1024 * 1024,
    }).done();
    return;
  }
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await pipeline(body, createWriteStream(file));
}

export async function deleteObject(key: string): Promise<void> {
  const driver = requireDriver();
  if (driver) {
    await driver.client.send(
      new DeleteObjectCommand({ Bucket: driver.bucket, Key: key }),
    );
    return;
  }
  await rm(localPath(key), { force: true });
}

/** Returns null when the object does not exist. */
export async function getObject(
  key: string,
  range?: string | null,
): Promise<StoredObject | null> {
  const driver = requireDriver();
  if (driver) {
    try {
      const res = await driver.client.send(
        new GetObjectCommand({
          Bucket: driver.bucket,
          Key: key,
          ...(range ? { Range: range } : {}),
        }),
      );
      if (!res.Body) return null;
      return {
        body: res.Body.transformToWebStream(),
        contentType: res.ContentType ?? mimeFromKey(key),
        contentLength: res.ContentLength,
        contentRange: res.ContentRange,
        etag: res.ETag,
        status: range && res.ContentRange ? 206 : 200,
      };
    } catch (e) {
      const name = (e as { name?: string }).name;
      if (name === "NoSuchKey" || name === "NotFound") return null;
      throw e;
    }
  }
  try {
    const file = localPath(key);
    const info = await stat(file);
    const buf = await readFile(file);
    return {
      body: new Blob([new Uint8Array(buf)]).stream(),
      contentType: mimeFromKey(key),
      contentLength: info.size,
      etag: `"${info.size}-${Math.round(info.mtimeMs)}"`,
      status: 200,
    };
  } catch {
    return null;
  }
}
