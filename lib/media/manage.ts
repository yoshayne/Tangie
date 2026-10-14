import { randomUUID } from "node:crypto";
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { deleteObject, putObject } from "@/lib/storage";
import { processImage } from "./process-image";

export type MediaRow = typeof schema.media.$inferSelect;

export type MediaListItem = Pick<
  MediaRow,
  | "id"
  | "kind"
  | "url"
  | "alt"
  | "width"
  | "height"
  | "mimeType"
  | "sizeBytes"
  | "originalFilename"
  | "createdAt"
> & {
  usageCount: number;
};

export async function listMedia(f: {
  q?: string;
  kind?: "image" | "video" | "document";
  unused?: boolean;
  limit?: number;
}): Promise<MediaListItem[]> {
  const db = getDb();
  const usage = db
    .select({ mediaId: schema.mediaUsage.mediaId, n: count().as("n") })
    .from(schema.mediaUsage)
    .groupBy(schema.mediaUsage.mediaId)
    .as("u");
  const q = f.q?.trim();
  const rows = await db
    .select({ m: schema.media, n: sql<number>`coalesce(${usage.n}, 0)` })
    .from(schema.media)
    .leftJoin(usage, eq(usage.mediaId, schema.media.id))
    .where(
      and(
        f.kind ? eq(schema.media.kind, f.kind) : undefined,
        f.unused ? sql`coalesce(${usage.n}, 0) = 0` : undefined,
        q
          ? or(
              ilike(schema.media.alt, `%${q}%`),
              ilike(schema.media.caption, `%${q}%`),
              ilike(schema.media.originalFilename, `%${q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(schema.media.createdAt))
    .limit(f.limit ?? 120);
  return rows.map(({ m, n }) => ({
    id: m.id,
    kind: m.kind,
    url: m.url,
    alt: m.alt,
    width: m.width,
    height: m.height,
    mimeType: m.mimeType,
    sizeBytes: m.sizeBytes,
    originalFilename: m.originalFilename,
    createdAt: m.createdAt,
    usageCount: Number(n),
  }));
}

export type UsageItem = {
  entityType: string;
  entityId: string;
  fieldPath: string;
  label: string;
  href: string | null;
};

/** "Used on" list for a photo, with a readable name and a link for each place. */
export async function getUsage(mediaId: string): Promise<UsageItem[]> {
  const db = getDb();
  const usage = await db
    .select()
    .from(schema.mediaUsage)
    .where(eq(schema.mediaUsage.mediaId, mediaId));
  const ids = (t: string) =>
    usage.filter((u) => u.entityType === t).map((u) => u.entityId);
  const [books, events, posts, credits, testimonials, sections] =
    await Promise.all([
      ids("book").length
        ? db
            .select({ id: schema.books.id, t: schema.books.title })
            .from(schema.books)
            .where(inArray(schema.books.id, ids("book")))
        : [],
      ids("event").length
        ? db
            .select({ id: schema.events.id, t: schema.events.title })
            .from(schema.events)
            .where(inArray(schema.events.id, ids("event")))
        : [],
      ids("post").length
        ? db
            .select({ id: schema.posts.id, t: schema.posts.title })
            .from(schema.posts)
            .where(inArray(schema.posts.id, ids("post")))
        : [],
      ids("credit").length
        ? db
            .select({ id: schema.credits.id, t: schema.credits.title })
            .from(schema.credits)
            .where(inArray(schema.credits.id, ids("credit")))
        : [],
      ids("testimonial").length
        ? db
            .select({ id: schema.testimonials.id, t: schema.testimonials.name })
            .from(schema.testimonials)
            .where(inArray(schema.testimonials.id, ids("testimonial")))
        : [],
      ids("section").length
        ? db
            .select({
              id: schema.sections.id,
              type: schema.sections.type,
              title: schema.pages.title,
              slug: schema.pages.slug,
            })
            .from(schema.sections)
            .innerJoin(
              schema.pages,
              eq(schema.sections.pageId, schema.pages.id),
            )
            .where(inArray(schema.sections.id, ids("section")))
        : [],
    ]);
  const name = (rows: Array<{ id: string; t: string }>, id: string) =>
    rows.find((r) => r.id === id)?.t ?? "(deleted)";
  return usage.map((u) => {
    switch (u.entityType) {
      case "book":
        return {
          ...u,
          label: `Book: ${name(books, u.entityId)}`,
          href: `/admin/books/${u.entityId}`,
        };
      case "event":
        return {
          ...u,
          label: `Event: ${name(events, u.entityId)}`,
          href: `/admin/events/${u.entityId}`,
        };
      case "post":
        return {
          ...u,
          label: `Journal post: ${name(posts, u.entityId)}`,
          href: `/admin/journal/${u.entityId}`,
        };
      case "credit":
        return {
          ...u,
          label: `Credit: ${name(credits, u.entityId)}`,
          href: `/admin/credits/${u.entityId}`,
        };
      case "testimonial":
        return {
          ...u,
          label: `Testimonial: ${name(testimonials, u.entityId)}`,
          href: `/admin/testimonials/${u.entityId}`,
        };
      case "section": {
        const s = sections.find((x) => x.id === u.entityId);
        return {
          ...u,
          label: s
            ? `Page “${s.title}”, ${s.type.replace(/_/g, " ")} section`
            : "A page section",
          href: s ? `/${s.slug}` : null,
        };
      }
      default:
        return { ...u, label: u.entityType, href: null };
    }
  });
}

/** Replaces the photo's file but keeps its id, so every page using it updates. */
export async function replaceImageFile(
  id: string,
  buffer: Buffer,
  filename: string,
): Promise<MediaRow> {
  const db = getDb();
  const [current] = await db
    .select()
    .from(schema.media)
    .where(eq(schema.media.id, id))
    .limit(1);
  if (!current || current.kind !== "image") throw new Error("Photo not found");

  const processed = await processImage(buffer);
  const now = new Date();
  const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const uuid = randomUUID();
  const slug =
    filename
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image";
  // A new key means a new URL, so browsers and CDNs never show the old picture from their cache.
  const key = `media/${dir}/${uuid}-${slug}.webp`;
  const originalKey = `originals/${dir}/${uuid}.${processed.originalFormat}`;
  await putObject(key, processed.webp, "image/webp");
  await putObject(originalKey, buffer, `image/${processed.originalFormat}`);

  const [row] = await db
    .update(schema.media)
    .set({
      key,
      url: `/${key}`,
      originalKey,
      originalFilename: filename,
      sizeBytes: processed.webp.length,
      width: processed.width,
      height: processed.height,
      blurDataUrl: processed.blurDataUrl,
      sha256: processed.sha256,
      updatedAt: now,
    })
    .where(eq(schema.media.id, id))
    .returning();

  await Promise.all([
    deleteObject(current.key),
    current.originalKey ? deleteObject(current.originalKey) : null,
  ]);
  await refreshReferences(row);
  return row;
}

type Json = unknown;
function replaceRefs(value: Json, row: MediaRow): Json {
  if (Array.isArray(value)) return value.map((v) => replaceRefs(v, row));
  if (value && typeof value === "object") {
    const obj = value as Record<string, Json>;
    if (obj.mediaId === row.id) {
      return {
        ...obj,
        src: row.url,
        width: row.width ?? 0,
        height: row.height ?? 0,
        blur: row.blurDataUrl ?? undefined,
      };
    }
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceRefs(v, row)]),
    );
  }
  return value;
}

/** Section props keep a cached copy of the photo's address and size; refresh it after a replace. */
export async function refreshReferences(row: MediaRow) {
  const db = getDb();
  const usage = await db
    .select()
    .from(schema.mediaUsage)
    .where(
      and(
        eq(schema.mediaUsage.mediaId, row.id),
        eq(schema.mediaUsage.entityType, "section"),
      ),
    );
  const ids = [...new Set(usage.map((u) => u.entityId))];
  if (ids.length === 0) return;
  const sections = await db
    .select()
    .from(schema.sections)
    .where(inArray(schema.sections.id, ids));
  for (const s of sections) {
    await db
      .update(schema.sections)
      .set({
        props: replaceRefs(s.props, row) as Record<string, unknown>,
        draftProps: s.draftProps
          ? (replaceRefs(s.draftProps, row) as Record<string, unknown>)
          : null,
      })
      .where(eq(schema.sections.id, s.id));
  }
}

export async function deleteMediaItem(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.media)
    .where(eq(schema.media.id, id))
    .limit(1);
  if (!row) return { ok: false, error: "That file no longer exists." };
  const usage = await getUsage(id);
  if (usage.length > 0) {
    return {
      ok: false,
      error: `This file is still used in ${usage.length} place${usage.length === 1 ? "" : "s"}: ${usage
        .slice(0, 5)
        .map((u) => u.label)
        .join("; ")}. Replace or remove it there first.`,
    };
  }
  await Promise.all([
    deleteObject(row.key),
    row.originalKey ? deleteObject(row.originalKey) : null,
  ]);
  await db.delete(schema.media).where(eq(schema.media.id, id));
  return { ok: true };
}
