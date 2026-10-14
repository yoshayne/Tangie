import Link from "next/link";
import { toggleBookPublished } from "@/app/admin/actions-books";
import {
  Badge,
  EmptyState,
  PageHeader,
  Table,
  Td,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import { asc } from "drizzle-orm";

export default async function BooksAdmin() {
  await requireAdmin();
  const books = await getDb()
    .select()
    .from(schema.books)
    .orderBy(asc(schema.books.sortOrder), asc(schema.books.title));
  return (
    <>
      <PageHeader
        title="Books"
        subtitle="Every book shown on the website."
        action={{ label: "Add a book", href: "/admin/books/new" }}
      />
      {books.length === 0 ? (
        <EmptyState>No books yet.</EmptyState>
      ) : (
        <Table head={["Title", "Status", "Visible", ""]}>
          {books.map((b) => (
            <tr key={b.id}>
              <Td>
                <Link
                  href={`/admin/books/${b.id}`}
                  className="font-semibold underline"
                >
                  {b.title}
                </Link>
                {b.seriesName ? (
                  <div className="text-xs text-stone">{b.seriesName}</div>
                ) : null}
              </Td>
              <Td>{b.status === "available" ? "Available" : "Coming soon"}</Td>
              <Td>
                <Badge tone={b.published ? "good" : "warn"}>
                  {b.published ? "Published" : "Hidden"}
                </Badge>
              </Td>
              <Td>
                <form action={toggleBookPublished.bind(null, b.id)}>
                  <button className="text-sm text-bronze underline">
                    {b.published ? "Hide" : "Publish"}
                  </button>
                </form>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
