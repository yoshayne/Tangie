import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteBook } from "@/app/admin/actions-books";
import { BookForm } from "@/components/admin/BookForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import { getMediaById } from "@/lib/media/refs";

export default async function EditBook({
  params,
}: PageProps<"/admin/books/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = getDb();
  const [b] = await db
    .select()
    .from(schema.books)
    .where(eq(schema.books.id, id));
  if (!b) notFound();
  const links = await db
    .select()
    .from(schema.bookLinks)
    .where(eq(schema.bookLinks.bookId, id))
    .orderBy(asc(schema.bookLinks.sortOrder));
  const [cover, lifestyle] = await Promise.all([
    getMediaById(b.coverMediaId),
    getMediaById(b.lifestyleMediaId),
  ]);
  const pick = (m: typeof cover) =>
    m ? { id: m.id, url: m.url, alt: m.alt } : null;
  return (
    <>
      <PageHeader title={b.title} subtitle={`/books/${b.slug}`} />
      <BookForm
        id={id}
        cover={pick(cover)}
        lifestyle={pick(lifestyle)}
        defaults={{
          ...b,
          links: links.map((l) => ({ label: l.label, url: l.url })),
        }}
      />
      <div className="mt-10 border-t border-line pt-6">
        <DeleteButton
          action={deleteBook.bind(null, id)}
          label="Delete this book"
          confirmText={`Delete “${b.title}” for good? This cannot be undone.`}
        />
      </div>
    </>
  );
}
