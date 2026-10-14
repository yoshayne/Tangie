import { and, count, desc, eq, isNotNull, ne } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { toImageRef } from "@/lib/media/ref";
import type { PostCardData } from "@/components/ui/PostCard";
import type { ImageRef } from "@/lib/sections/types";
import { longDate } from "./format";
import { readingMinutes } from "@/lib/html";

const published = and(
  eq(schema.posts.status, "published"),
  isNotNull(schema.posts.publishedAt),
);

function toCard(
  post: typeof schema.posts.$inferSelect,
  cover: typeof schema.media.$inferSelect | null,
): PostCardData {
  return {
    slug: post.slug,
    title: post.title,
    date: post.publishedAt ? longDate(post.publishedAt) : "",
    image: cover ? toImageRef(cover) : undefined,
  };
}

/** Latest published journal posts, newest first. */
export async function getLatestPosts(
  count: number,
  category?: string,
): Promise<PostCardData[]> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  const rows = await getDb()
    .select({ post: schema.posts, cover: schema.media })
    .from(schema.posts)
    .leftJoin(schema.media, eq(schema.posts.coverMediaId, schema.media.id))
    .where(
      and(
        published,
        category ? eq(schema.posts.category, category) : undefined,
      ),
    )
    .orderBy(desc(schema.posts.publishedAt))
    .limit(count);

  // Nothing published yet may just mean setup is still running; check again soon.
  if (rows.length === 0) cacheLife("minutes");
  return rows.map(({ post, cover }) => toCard(post, cover));
}

export type PostsPage = {
  posts: PostCardData[];
  total: number;
  page: number;
  perPage: number;
};

/** One page of the journal, optionally filtered by category. */
export async function getPostsPage(
  page: number,
  perPage: number,
  category?: string,
): Promise<PostsPage> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  const db = getDb();
  const where = and(
    published,
    category ? eq(schema.posts.category, category) : undefined,
  );
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.posts)
    .where(where);
  const rows = await db
    .select({ post: schema.posts, cover: schema.media })
    .from(schema.posts)
    .leftJoin(schema.media, eq(schema.posts.coverMediaId, schema.media.id))
    .where(where)
    .orderBy(desc(schema.posts.publishedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);
  if (n === 0) cacheLife("minutes");
  return {
    posts: rows.map(({ post, cover }) => toCard(post, cover)),
    total: n,
    page,
    perPage,
  };
}

export type PostDetail = {
  slug: string;
  title: string;
  excerpt: string | null;
  bodyHtml: string;
  category: string | null;
  authorName: string;
  publishedAtIso: string;
  dateLabel: string;
  readingMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
  cover: ImageRef | null;
};

export async function getPostDetail(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  const [row] = await getDb()
    .select({ post: schema.posts, cover: schema.media })
    .from(schema.posts)
    .leftJoin(schema.media, eq(schema.posts.coverMediaId, schema.media.id))
    .where(and(eq(schema.posts.slug, slug), published))
    .limit(1);
  if (!row) {
    cacheLife("seconds");
    return null;
  }
  const p = row.post;
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    bodyHtml: p.bodyHtml,
    category: p.category,
    authorName: p.authorName,
    publishedAtIso: p.publishedAt!.toISOString(),
    dateLabel: longDate(p.publishedAt!),
    readingMinutes: readingMinutes(p.bodyHtml),
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription ?? p.excerpt,
    cover: row.cover ? toImageRef(row.cover) : null,
  };
}

/** Other posts to read next: same category first, then newest. */
export async function getRelatedPosts(
  slug: string,
  category: string | null,
  limit = 3,
): Promise<PostCardData[]> {
  "use cache";
  cacheLife("max");
  cacheTag("posts");

  const rows = await getDb()
    .select({ post: schema.posts, cover: schema.media })
    .from(schema.posts)
    .leftJoin(schema.media, eq(schema.posts.coverMediaId, schema.media.id))
    .where(and(published, ne(schema.posts.slug, slug)))
    .orderBy(desc(schema.posts.publishedAt));
  const sorted = [...rows].sort(
    (a, b) =>
      Number(b.post.category === category) -
      Number(a.post.category === category),
  );
  return sorted.slice(0, limit).map(({ post, cover }) => toCard(post, cover));
}

export async function getJournalCategories(): Promise<string[]> {
  "use cache";
  cacheLife("max");
  cacheTag("settings");

  const [row] = await getDb()
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "journal_categories"))
    .limit(1);
  if (!row) cacheLife("seconds");
  return (row?.value as string[] | undefined) ?? [];
}
