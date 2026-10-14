import { EVENT_ZONES } from "@/lib/admin/zones";
import { EventForm } from "@/components/admin/EventForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewEvent() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add an event" />
      <EventForm
        id={null}
        image={null}
        zones={EVENT_ZONES}
        defaults={{ timezone: "America/New_York", published: false }}
      />
    </>
  );
}
