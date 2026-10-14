import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { toImageRef } from "@/lib/media/ref";
import type { ImageRef } from "@/lib/sections/types";

export type BookSummary = {
  slug: string;
  title: string;
  shortBlurb: string | null;
  buyUrl: string | null;
};

export type BookCardData = {
  slug: string;
  title: string;
  seriesLine: string | null;
  status: "available" | "coming_soon";
  cover: ImageRef | null;
};

export type BookDetail = {
  slug: string;
  title: string;
  subtitle: string | null;
  tagline: string | null;
  seriesName: string | null;
  seriesOrder: number | null;
  status: "available" | "coming_soon";
  shortBlurb: string | null;
  synopsisHtml: string | null;
  cover: ImageRef | null;
  links: Array<{ label: string; url: string }>;
};

function seriesLine(name: string | null, order: number | null) {
  if (!name) return null;
  return order ? `${name} · Book ${order}` : name;
}

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
  if (!book || !book.published) {
    cacheLife("seconds");
    return null;
  }
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

export async function getBookDetail(slug: string): Promise<BookDetail | null> {
  "use cache";
  cacheLife("max");
  cacheTag("books");

  const db = getDb();
  const [row] = await db
    .select({ book: schema.books, cover: schema.media })
    .from(schema.books)
    .leftJoin(schema.media, eq(schema.books.coverMediaId, schema.media.id))
    .where(and(eq(schema.books.slug, slug), eq(schema.books.published, true)))
    .limit(1);
  if (!row) {
    cacheLife("seconds");
    return null;
  }
  const links = await db
    .select()
    .from(schema.bookLinks)
    .where(eq(schema.bookLinks.bookId, row.book.id))
    .orderBy(asc(schema.bookLinks.sortOrder));
  const b = row.book;
  return {
    slug: b.slug,
    title: b.title,
    subtitle: b.subtitle,
    tagline: b.tagline,
    seriesName: b.seriesName,
    seriesOrder: b.seriesOrder,
    status: b.status,
    shortBlurb: b.shortBlurb,
    synopsisHtml: b.synopsisHtml,
    cover: row.cover ? toImageRef(row.cover) : null,
    links: links.map((l) => ({ label: l.label, url: l.url })),
  };
}

/** Published books for the grid, in series order. */
export async function getBooks(
  status?: "available" | "coming_soon",
): Promise<BookCardData[]> {
  "use cache";
  cacheLife("max");
  cacheTag("books");

  const rows = await getDb()
    .select({ book: schema.books, cover: schema.media })
    .from(schema.books)
    .leftJoin(schema.media, eq(schema.books.coverMediaId, schema.media.id))
    .where(
      and(
        eq(schema.books.published, true),
        status ? eq(schema.books.status, status) : undefined,
      ),
    )
    .orderBy(asc(schema.books.sortOrder));
  if (rows.length === 0) cacheLife("minutes");
  return rows.map(({ book, cover }) => ({
    slug: book.slug,
    title: book.title,
    seriesLine: seriesLine(book.seriesName, book.seriesOrder),
    status: book.status,
    cover: cover ? toImageRef(cover) : null,
  }));
}
