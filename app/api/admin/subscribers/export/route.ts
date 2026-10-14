import { desc } from "drizzle-orm";
import { requireAdminRequest } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

// Spreadsheet programs run text starting with = + - @ as a formula; neutralise that.
function cell(v: string | null): string {
  let s = v ?? "";
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const denied = await requireAdminRequest(request);
  if (denied instanceof Response) return denied;
  const rows = await getDb()
    .select()
    .from(schema.subscribers)
    .orderBy(desc(schema.subscribers.createdAt));
  const lines = [
    "email,source,joined,in_brevo",
    ...rows.map((r) =>
      [
        cell(r.email),
        cell(r.source),
        cell(r.createdAt.toISOString()),
        r.brevoSynced ? "yes" : "no",
      ].join(","),
    ),
  ];
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
