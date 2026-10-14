import { randomUUID } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { putObject } from "@/lib/storage";
import { processImage } from "./process-image";

export type MediaRow = typeof schema.media.$inferSelect;

function slugify(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  );
}

/**
 * Processes an image, stores both the served WebP and the untouched original in the bucket,
 * and records it in `media`. Idempotent: the same file (by hash, or by old Wix URL) is never
 * stored twice, so re-running the seed is safe.
 */
export async function saveImage(opts: SaveImageOptions): Promise<MediaRow> {
  return (await saveImageDetailed(opts)).row;
}

type SaveImageOptions = {
  buffer: Buffer;
  filename: string;
  alt: string;
  focal?: [number, number];
  source: "upload" | "wix_migration" | "mockup";
  legacyUrl?: string;
};

/** Like saveImage, but also says whether the file was new or already in the library. */
export async function saveImageDetailed(
  opts: SaveImageOptions,
): Promise<{ row: MediaRow; created: boolean }> {
  const db = getDb();
  const processed = await processImage(opts.buffer);

  const existing = await db
    .select()
    .from(schema.media)
    .where(
      opts.legacyUrl
        ? or(
            eq(schema.media.sha256, processed.sha256),
            eq(schema.media.legacyUrl, opts.legacyUrl),
          )
        : eq(schema.media.sha256, processed.sha256),
    )
    .limit(1);
  if (existing[0]) return { row: existing[0], created: false };

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = randomUUID();
  const key = `media/${yyyy}/${mm}/${uuid}-${slugify(opts.filename)}.webp`;
  const originalKey = `originals/${yyyy}/${mm}/${uuid}.${processed.originalFormat}`;

  await putObject(key, processed.webp, "image/webp");
  await putObject(
    originalKey,
    opts.buffer,
    `image/${processed.originalFormat === "jpeg" ? "jpeg" : processed.originalFormat}`,
  );

  const [row] = await db
    .insert(schema.media)
    .values({
      kind: "image",
      key,
      url: `/${key}`,
      originalKey,
      originalFilename: opts.filename,
      mimeType: "image/webp",
      sizeBytes: processed.webp.length,
      width: processed.width,
      height: processed.height,
      alt: opts.alt,
      focalX: opts.focal?.[0] ?? 0.5,
      focalY: opts.focal?.[1] ?? 0.5,
      blurDataUrl: processed.blurDataUrl,
      sha256: processed.sha256,
      source: opts.source,
      legacyUrl: opts.legacyUrl ?? null,
    })
    .returning();
  return { row, created: true };
}
