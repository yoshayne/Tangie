import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";

export type BookSummary = {
  slug: string;
  title: string;
  shortBlurb: string | null;
  buyUrl: string | null;
};

export async function getBookBySlug(slug: string): Promise<BookSummary | null> {
  "use cache";
  cacheLife("max");
  cacheTag("books");

  const db = getDb();
  const [book] = await db
    .select()
    .from(schema.books)
    .where(eq(schema.books.slug, slug))
    .limit(1);
  if (!book || !book.published) return null;
  const [link] = await db
    .select()
    .from(schema.bookLinks)
    .where(eq(schema.bookLinks.bookId, book.id))
    .orderBy(asc(schema.bookLinks.sortOrder))
    .limit(1);
  return {
    slug: book.slug,
    title: book.title,
    shortBlurb: book.shortBlurb,
    buyUrl: link?.url ?? null,
  };
}
