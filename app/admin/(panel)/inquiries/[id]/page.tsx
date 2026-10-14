import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteInquiry, setInquiryStatus } from "@/app/admin/actions-people";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export default async function InquiryDetail({
  params,
}: PageProps<"/admin/inquiries/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [q] = await getDb()
    .select()
    .from(schema.inquiries)
    .where(eq(schema.inquiries.id, id));
  if (!q) notFound();
  const name = [q.firstName, q.lastName].filter(Boolean).join(" ") || q.email;
  const details: Array<[string, string | null]> = [
    ["Email", q.email],
    ["Phone", q.phone],
    ["Organization", q.organization],
    ["Event date", q.eventDate],
    ["Event location", q.eventLocation],
    ["Audience", q.audience],
    ["Attendance", q.attendance],
    ["Budget", q.budget],
  ];
  const subject = encodeURIComponent(`Re: your ${q.type} inquiry`);
  return (
    <>
      <PageHeader
        title={name}
        subtitle={`${q.type} · ${q.createdAt.toLocaleString("en-US", { timeZone: "America/New_York" })}`}
      />
      <div className="space-y-6">
        <Card>
          <p className="mb-3">
            <Badge>{q.status}</Badge>
          </p>
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {details
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-[0.12em] text-stone">
                    {k}
                  </dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
        </Card>
        <Card title="Message">
          <p className="whitespace-pre-wrap">{q.message}</p>
        </Card>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${q.email}?subject=${subject}`}
            className="bg-bronze px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-white"
          >
            Reply by email
          </a>
          {(["new", "read", "archived"] as const)
            .filter((s) => s !== q.status)
            .map((s) => (
              <form key={s} action={setInquiryStatus.bind(null, id, s)}>
                <button className="border border-line bg-white px-4 py-2 text-sm">
                  Mark as {s}
                </button>
              </form>
            ))}
          <DeleteButton
            action={deleteInquiry.bind(null, id)}
            confirmText="Delete this inquiry for good?"
          />
        </div>
      </div>
    </>
  );
}
