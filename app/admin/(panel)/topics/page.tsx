import { asc } from "drizzle-orm";
import Link from "next/link";
import { EmptyState, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export default async function TopicsAdmin() {
  await requireAdmin();
  const rows = await getDb()
    .select()
    .from(schema.speakingTopics)
    .orderBy(
      asc(schema.speakingTopics.sortOrder),
      asc(schema.speakingTopics.title),
    );
  return (
    <>
      <PageHeader
        title="Speaking topics"
        subtitle="Talk topics Tangie offers."
        action={{ label: "Add a topic", href: "/admin/topics/new" }}
      />
      <p className="mb-6 border border-line bg-white p-4 text-sm text-stone">
        Note: the topics list shown on the Speaking page is edited in the page
        builder (coming next). This list keeps your topics ready for it.
      </p>
      {rows.length === 0 ? (
        <EmptyState>No topics yet.</EmptyState>
      ) : (
        <Table head={["Topic", "Description"]}>
          {rows.map((t) => (
            <tr key={t.id}>
              <Td>
                <Link
                  href={`/admin/topics/${t.id}`}
                  className="font-semibold underline"
                >
                  {t.title}
                </Link>
              </Td>
              <Td>{t.description ?? "—"}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
