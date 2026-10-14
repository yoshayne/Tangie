import { asc } from "drizzle-orm";
import Link from "next/link";
import { toggleTestimonialApproved } from "@/app/admin/actions-small";
import {
  Badge,
  EmptyState,
  PageHeader,
  Table,
  Td,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export default async function TestimonialsAdmin() {
  await requireAdmin();
  const rows = await getDb()
    .select()
    .from(schema.testimonials)
    .orderBy(asc(schema.testimonials.sortOrder));
  return (
    <>
      <PageHeader
        title="Testimonials"
        subtitle="Only approved testimonials appear on the website."
        action={{ label: "Add a testimonial", href: "/admin/testimonials/new" }}
      />
      {rows.length === 0 ? (
        <EmptyState>No testimonials yet.</EmptyState>
      ) : (
        <Table head={["Quote", "From", "Status", ""]}>
          {rows.map((t) => (
            <tr key={t.id}>
              <Td>
                <Link
                  href={`/admin/testimonials/${t.id}`}
                  className="underline"
                >
                  {t.quote.length > 110 ? `${t.quote.slice(0, 110)}…` : t.quote}
                </Link>
              </Td>
              <Td>
                {t.name}
                {t.org ? (
                  <div className="text-xs text-stone">{t.org}</div>
                ) : null}
              </Td>
              <Td>
                <Badge tone={t.approved ? "good" : "warn"}>
                  {t.approved ? "Approved" : "Not approved"}
                </Badge>
              </Td>
              <Td>
                <form action={toggleTestimonialApproved.bind(null, t.id)}>
                  <button className="text-sm text-bronze underline">
                    {t.approved ? "Unapprove" : "Approve"}
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
