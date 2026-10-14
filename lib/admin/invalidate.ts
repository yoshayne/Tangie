import { eq, inArray } from "drizzle-orm";
import { revalidateTag, updateTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { bumpRoutingCache } from "@/lib/routing/lookup";

type Mode = "action" | "route";

/** Refreshes cached public pages. Server actions use updateTag (instant); route handlers use revalidateTag. */
export function invalidate(tags: Iterable<string>, mode: Mode = "action") {
  for (const tag of new Set(tags)) {
    if (mode === "action") updateTag(tag);
    else revalidateTag(tag, "max");
  }
  bumpRoutingCache();
}

const ENTITY_TAG: Record<string, string> = {
  book: "books",
  event: "events",
  post: "posts",
  credit: "credits",
  testimonial: "testimonials",
  settings: "settings",
};

/** Every cache tag that depends on a photo, so changing it refreshes every page that shows it. */
export async function tagsForMedia(mediaId: string): Promise<Set<string>> {
  const db = getDb();
  const usage = await db
    .select()
    .from(schema.mediaUsage)
    .where(eq(schema.mediaUsage.mediaId, mediaId));
  const tags = new Set<string>();
  const sectionIds = usage
    .filter((u) => u.entityType === "section")
    .map((u) => u.entityId);
  const pageIds = usage
    .filter((u) => u.entityType === "page")
    .map((u) => u.entityId);
  for (const u of usage)
    if (ENTITY_TAG[u.entityType]) tags.add(ENTITY_TAG[u.entityType]);
  if (sectionIds.length) {
    const rows = await db
      .select({ slug: schema.pages.slug })
      .from(schema.sections)
      .innerJoin(schema.pages, eq(schema.sections.pageId, schema.pages.id))
      .where(inArray(schema.sections.id, sectionIds));
    for (const r of rows) tags.add(`page:${r.slug}`);
  }
  if (pageIds.length) {
    const rows = await db
      .select({ slug: schema.pages.slug })
      .from(schema.pages)
      .where(inArray(schema.pages.id, pageIds));
    for (const r of rows) tags.add(`page:${r.slug}`);
  }
  return tags;
}
