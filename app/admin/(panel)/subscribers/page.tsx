import { desc } from "drizzle-orm";
import { deleteSubscriber } from "@/app/admin/actions-people";
import {
  Badge,
  EmptyState,
  PageHeader,
  Table,
  Td,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export default async function SubscribersAdmin() {
  await requireAdmin();
  const rows = await getDb()
    .select()
    .from(schema.subscribers)
    .orderBy(desc(schema.subscribers.createdAt))
    .limit(1000);
  return (
    <>
      <PageHeader
        title="Subscribers"
        subtitle={`${rows.length} on the mailing list.`}
      />
      <p className="mb-6">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/subscribers/export"
          className="border border-bronze-light px-4 py-2 text-sm text-bronze"
        >
          Download as CSV
        </a>
      </p>
      {rows.length === 0 ? (
        <EmptyState>No subscribers yet.</EmptyState>
      ) : (
        <Table head={["Email", "Source", "Joined", "In Brevo", ""]}>
          {rows.map((s) => (
            <tr key={s.id}>
              <Td>{s.email}</Td>
              <Td>{s.source ?? "—"}</Td>
              <Td>
                {s.createdAt.toLocaleDateString("en-US", {
                  dateStyle: "medium",
                })}
              </Td>
              <Td>
                <Badge tone={s.brevoSynced ? "good" : "warn"}>
                  {s.brevoSynced ? "Yes" : "No"}
                </Badge>
              </Td>
              <Td>
                <form action={deleteSubscriber.bind(null, s.id)}>
                  <button className="text-sm text-[#9b2c2c] underline">
                    Remove
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
