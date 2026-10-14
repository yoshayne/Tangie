"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminAction } from "@/lib/admin/auth";
import { addSlugRedirect, slugTaken } from "@/lib/admin/crud";
import {
  fail,
  parseForm,
  slugify,
  type AdminFormState,
} from "@/lib/admin/form";
import { invalidate } from "@/lib/admin/invalidate";
import {
  bool,
  int,
  opt,
  optInt,
  req,
  rows,
  url,
  uuidOrNull,
} from "@/lib/admin/zod";
import { getDb, schema } from "@/lib/db";
import { sanitizeRich } from "@/lib/html";
import { setMediaUsage } from "@/lib/media/usage";

const BookForm = z.object({
  title: req("Title"),
  slug: opt(100),
  subtitle: opt(200),
  tagline: opt(200),
  seriesName: opt(120),
  seriesOrder: optInt("Series number"),
  status: z.enum(["available", "coming_soon"]),
  shortBlurb: opt(600),
  synopsisHtml: z.string().optional(),
  coverMediaId: uuidOrNull,
  lifestyleMediaId: uuidOrNull,
  published: bool,
  sortOrder: int("Order"),
  links: rows(
    z.object({
      label: z.string().trim().max(80),
      url: z.string().trim().max(500),
    }),
  ),
});

export async function saveBook(
  id: string | null,
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();
  const parsed = parseForm(BookForm, fd);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  const slug = slugify(d.slug ?? d.title);
  if (await slugTaken("books", slug, id))
    return fail(
      "That web address is already used by another book.",
      parsed.values,
      { slug: "Choose a different one." },
    );

  const links = d.links.filter((l) => l.label || l.url);
  for (const l of links) {
    const check = url("Link", true).safeParse(l.url);
    if (!l.label || !check.success)
      return fail(
        "Each buy link needs a label and an address starting with https://",
        parsed.values,
        { links: "Check the buy links." },
      );
  }

  const db = getDb();
  const values = {
    slug,
    title: d.title,
    subtitle: d.subtitle,
    tagline: d.tagline,
    seriesName: d.seriesName,
    seriesOrder: d.seriesOrder,
    status: d.status,
    shortBlurb: d.shortBlurb,
    synopsisHtml: d.synopsisHtml ? sanitizeRich(d.synopsisHtml) : null,
    coverMediaId: d.coverMediaId,
    lifestyleMediaId: d.lifestyleMediaId,
    published: d.published,
    sortOrder: d.sortOrder,
    updatedAt: new Date(),
  };

  let bookId = id;
  if (id) {
    const [old] = await db
      .select({ slug: schema.books.slug })
      .from(schema.books)
      .where(eq(schema.books.id, id));
    await db.update(schema.books).set(values).where(eq(schema.books.id, id));
    if (old && old.slug !== slug)
      await addSlugRedirect(`/books/${old.slug}`, `/books/${slug}`);
  } else {
    const [row] = await db.insert(schema.books).values(values).returning();
    bookId = row.id;
  }
  await db.delete(schema.bookLinks).where(eq(schema.bookLinks.bookId, bookId!));
  if (links.length)
    await db.insert(schema.bookLinks).values(
      links.map((l, i) => ({
        bookId: bookId!,
        label: l.label,
        url: l.url,
        sortOrder: i + 1,
      })),
    );
  await setMediaUsage(
    db,
    "book",
    bookId!,
    [
      d.coverMediaId && { mediaId: d.coverMediaId, fieldPath: "cover" },
      d.lifestyleMediaId && {
        mediaId: d.lifestyleMediaId,
        fieldPath: "lifestyle",
      },
    ].filter((x): x is { mediaId: string; fieldPath: string } => !!x),
  );
  invalidate(["books"]);
  if (!id) redirect(`/admin/books/${bookId}?created=1`);
  return { status: "success", message: "Book saved." };
}

export async function toggleBookPublished(id: string) {
  await requireAdminAction();
  const db = getDb();
  const [b] = await db
    .select()
    .from(schema.books)
    .where(eq(schema.books.id, id));
  if (!b) return;
  await db
    .update(schema.books)
    .set({ published: !b.published, updatedAt: new Date() })
    .where(eq(schema.books.id, id));
  invalidate(["books"]);
}

export async function deleteBook(id: string) {
  await requireAdminAction();
  const db = getDb();
  await setMediaUsage(db, "book", id, []);
  await db.delete(schema.books).where(eq(schema.books.id, id));
  invalidate(["books"]);
  redirect("/admin/books");
}
