import { and, eq, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { versionOf, type ShareImage } from "@/lib/seo";

/**
 * The picture used for sharing when a page has none of its own: the one chosen in
 * Site Settings, otherwise the photo in the home page's first section.
 */
export async function getDefaultShareImage(): Promise<ShareImage | null> {
  "use cache";
  cacheLife("max");
  cacheTag("settings", "page:");

  const db = getDb();
  const [setting] = await db
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "share_image"))
    .limit(1);
  const chosen = (setting?.value as { id?: string } | undefined)?.id;
  if (chosen) {
    const [m] = await db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, chosen))
      .limit(1);
    if (m) return { mediaId: m.id, version: versionOf(m.url), alt: m.alt };
  }

  const [home] = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.slug, ""))
    .limit(1);
  if (!home) {
    cacheLife("seconds");
    return null;
  }
  const [first] = await db
    .select()
    .from(schema.sections)
    .where(eq(schema.sections.pageId, home.id))
    .orderBy(schema.sections.sortOrder)
    .limit(1);
  const img = first?.props?.image as
    { mediaId?: string; src?: string; alt?: string } | undefined;
  return img?.mediaId
    ? { mediaId: img.mediaId, version: versionOf(img.src), alt: img.alt }
    : null;
}

export type SitemapEntry = { path: string; lastModified: Date };

/** Every public address, for sitemap.xml. */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("sitemap", "posts", "events", "books");

  const db = getDb();
  const [pages, books, events, posts] = await Promise.all([
    db
      .select({ slug: schema.pages.slug, at: schema.pages.updatedAt })
      .from(schema.pages)
      .where(eq(schema.pages.status, "published")),
    db
      .select({ slug: schema.books.slug, at: schema.books.updatedAt })
      .from(schema.books)
      .where(eq(schema.books.published, true)),
    db
      .select({ slug: schema.events.slug, at: schema.events.updatedAt })
      .from(schema.events)
      .where(eq(schema.events.published, true)),
    db
      .select({ slug: schema.posts.slug, at: schema.posts.updatedAt })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.status, "published"),
          isNotNull(schema.posts.publishedAt),
        ),
      ),
  ]);
  // Behind-the-scenes stacks and the thank-you page are not for search results.
  const hidden = (slug: string) =>
    slug.startsWith("_template") || slug === "newsletter-confirmed";
  return [
    ...pages
      .filter((p) => !hidden(p.slug))
      .map((p) => ({ path: p.slug ? `/${p.slug}` : "/", lastModified: p.at })),
    ...books.map((b) => ({ path: `/books/${b.slug}`, lastModified: b.at })),
    ...events.map((e) => ({ path: `/events/${e.slug}`, lastModified: e.at })),
    ...posts.map((p) => ({ path: `/journal/${p.slug}`, lastModified: p.at })),
  ];
}
