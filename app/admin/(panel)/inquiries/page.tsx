import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  Badge,
  EmptyState,
  PageHeader,
  Table,
  Td,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

const STATUSES = ["new", "read", "archived"] as const;

export default async function InquiriesAdmin({
  searchParams,
}: PageProps<"/admin/inquiries">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const type = typeof sp.type === "string" && sp.type ? sp.type : undefined;
  const db = getDb();
  const [rows, typeRows] = await Promise.all([
    db
      .select()
      .from(schema.inquiries)
      .where(
        and(
          status ? eq(schema.inquiries.status, status) : undefined,
          type ? eq(schema.inquiries.type, type) : undefined,
        ),
      )
      .orderBy(desc(schema.inquiries.createdAt))
      .limit(200),
    db.selectDistinct({ type: schema.inquiries.type }).from(schema.inquiries),
  ]);
  return (
    <>
      <PageHeader
        title="Inquiries"
        subtitle="Messages from the website forms."
      />
      <form
        action="/admin/inquiries"
        className="mb-6 flex flex-wrap items-end gap-3"
      >
        <label className="text-sm font-semibold">
          Status
          <select
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 block border border-line bg-white px-3 py-2 font-normal"
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Type
          <select
            name="type"
            defaultValue={type ?? ""}
            className="mt-1 block border border-line bg-white px-3 py-2 font-normal"
          >
            <option value="">All</option>
            {typeRows.map((t) => (
              <option key={t.type} value={t.type}>
                {t.type}
              </option>
            ))}
          </select>
        </label>
        <button className="border border-bronze-light px-4 py-2 text-sm text-bronze">
          Filter
        </button>
        {status || type ? (
          <Link
            href="/admin/inquiries"
            className="pb-2 text-sm text-stone underline"
          >
            Clear
          </Link>
        ) : null}
      </form>
      {rows.length === 0 ? (
        <EmptyState>No inquiries match.</EmptyState>
      ) : (
        <Table head={["From", "Type", "Received", "Status"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link
                  href={`/admin/inquiries/${r.id}`}
                  className="font-semibold underline"
                >
                  {[r.firstName, r.lastName].filter(Boolean).join(" ") ||
                    r.email}
                </Link>
                <div className="text-xs text-stone">{r.email}</div>
              </Td>
              <Td>{r.type}</Td>
              <Td>
                {r.createdAt.toLocaleString("en-US", {
                  timeZone: "America/New_York",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Td>
              <Td>
                <Badge
                  tone={
                    r.status === "new"
                      ? "warn"
                      : r.status === "read"
                        ? "good"
                        : "neutral"
                  }
                >
                  {r.status}
                </Badge>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
