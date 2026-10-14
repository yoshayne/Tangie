import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { requireAdminRequest } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import {
  DOC_MAX_BYTES,
  VIDEO_MAX_BYTES,
  inspectFile,
} from "@/lib/media/validate";
import { deleteObject, putObjectStream } from "@/lib/storage";

/**
 * Videos and documents (MP4/MOV, PDF/ZIP). The body is the raw file, streamed straight into the
 * bucket so a 500 MB video never has to fit in memory. The file name is sent in `x-filename`.
 */
export async function POST(request: Request) {
  const admin = await requireAdminRequest(request);
  if (admin instanceof Response) return admin;
  if (!request.body)
    return Response.json({ error: "No file received." }, { status: 400 });

  const filename = decodeURIComponent(
    request.headers.get("x-filename") ?? "upload",
  );
  const declared = Number(request.headers.get("content-length") ?? 0);

  // Read the first few KB to check the real file type before accepting the rest.
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let headLen = 0;
  while (headLen < 4100) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    headLen += value.length;
  }
  const head = Buffer.concat(chunks);
  const verdict = await inspectFile(head, declared || head.length);
  if (!verdict.ok) {
    await reader.cancel();
    return Response.json({ error: verdict.error }, { status: 400 });
  }
  if (verdict.kind === "image") {
    await reader.cancel();
    return Response.json(
      { error: "Photos use the photo uploader." },
      { status: 400 },
    );
  }
  const limit = verdict.kind === "video" ? VIDEO_MAX_BYTES : DOC_MAX_BYTES;

  let total = 0;
  async function* body() {
    for (const c of chunks) {
      total += c.length;
      yield c;
    }
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      total += value.length;
      if (total > limit) throw new Error("TOO_BIG");
      yield value;
    }
  }

  const now = new Date();
  const slug =
    filename
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  const key = `media/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}-${slug}.${verdict.ext}`;

  try {
    await putObjectStream(key, Readable.from(body()), verdict.mime);
  } catch (e) {
    await deleteObject(key).catch(() => {});
    if ((e as Error).message === "TOO_BIG") {
      return Response.json(
        {
          error: `This file is over the ${Math.round(limit / 1024 / 1024)} MB limit.`,
        },
        { status: 413 },
      );
    }
    console.error("File upload failed:", e);
    return Response.json(
      { error: "The upload failed. Please try again." },
      { status: 500 },
    );
  }

  const [row] = await getDb()
    .insert(schema.media)
    .values({
      kind: verdict.kind,
      key,
      url: `/${key}`,
      originalFilename: filename,
      mimeType: verdict.mime,
      sizeBytes: total,
      alt: "",
      source: "upload",
    })
    .returning();
  return Response.json({
    media: {
      id: row.id,
      url: row.url,
      kind: row.kind,
      sizeBytes: row.sizeBytes,
      name: filename,
    },
  });
}
