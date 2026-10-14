import { and, desc, eq, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { toImageRef } from "@/lib/media/ref";
import type { PostCardData } from "@/components/ui/PostCard";
import { longDate } from "./format";

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
        eq(schema.posts.status, "published"),
        isNotNull(schema.posts.publishedAt),
        category ? eq(schema.posts.category, category) : undefined,
      ),
    )
    .orderBy(desc(schema.posts.publishedAt))
    .limit(count);

  // Nothing published yet may just mean setup is still running; check again soon.
  if (rows.length === 0) cacheLife("minutes");

  return rows.map(({ post, cover }) => ({
    slug: post.slug,
    title: post.title,
    date: post.publishedAt ? longDate(post.publishedAt) : "",
    image: cover ? toImageRef(cover) : undefined,
  }));
}
