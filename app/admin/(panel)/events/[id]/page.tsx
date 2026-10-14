import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteEvent } from "@/app/admin/actions-events";
import { EVENT_ZONES } from "@/lib/admin/zones";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { EventForm } from "@/components/admin/EventForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { dateToZonedInput } from "@/lib/admin/zod";
import { getDb, schema } from "@/lib/db";
import { getMediaById } from "@/lib/media/refs";

export default async function EditEvent({
  params,
}: PageProps<"/admin/events/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [e] = await getDb()
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, id));
  if (!e) notFound();
  const img = await getMediaById(e.imageMediaId);
  return (
    <>
      <PageHeader title={e.title} subtitle={`/events/${e.slug}`} />
      <EventForm
        id={id}
        zones={EVENT_ZONES}
        image={img ? { id: img.id, url: img.url, alt: img.alt } : null}
        defaults={{
          ...e,
          startsAt: dateToZonedInput(e.startsAt, e.timezone),
          endsAt: dateToZonedInput(e.endsAt, e.timezone),
        }}
      />
      <div className="mt-10 border-t border-line pt-6">
        <DeleteButton
          action={deleteEvent.bind(null, id)}
          label="Delete this event"
          confirmText={`Delete “${e.title}” for good?`}
        />
      </div>
    </>
  );
}
