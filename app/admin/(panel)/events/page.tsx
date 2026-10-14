import { desc } from "drizzle-orm";
import Link from "next/link";
import { toggleEventPublished } from "@/app/admin/actions-events";
import {
  Badge,
  EmptyState,
  PageHeader,
  Table,
  Td,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export default async function EventsAdmin() {
  await requireAdmin();
  const events = await getDb()
    .select()
    .from(schema.events)
    .orderBy(desc(schema.events.startsAt));
  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Upcoming and past events."
        action={{ label: "Add an event", href: "/admin/events/new" }}
      />
      {events.length === 0 ? (
        <EmptyState>No events yet.</EmptyState>
      ) : (
        <Table head={["Event", "Date", "Visible", ""]}>
          {events.map((e) => (
            <tr key={e.id}>
              <Td>
                <Link
                  href={`/admin/events/${e.id}`}
                  className="font-semibold underline"
                >
                  {e.title}
                </Link>
              </Td>
              <Td>
                {e.startsAt.toLocaleDateString("en-US", {
                  timeZone: e.timezone,
                  dateStyle: "medium",
                })}
                {e.startsAt < new Date() ? (
                  <span className="ml-2 text-xs text-stone">(past)</span>
                ) : null}
              </Td>
              <Td>
                <Badge tone={e.published ? "good" : "warn"}>
                  {e.published ? "Published" : "Hidden"}
                </Badge>
              </Td>
              <Td>
                <form action={toggleEventPublished.bind(null, e.id)}>
                  <button className="text-sm text-bronze underline">
                    {e.published ? "Hide" : "Publish"}
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
