import { asc } from "drizzle-orm";
import Link from "next/link";
import { EmptyState, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

const LABEL = { stage: "Stage play", film_tv: "Film & TV", other: "Other" };

export default async function CreditsAdmin() {
  await requireAdmin();
  const rows = await getDb()
    .select()
    .from(schema.credits)
    .orderBy(asc(schema.credits.sortOrder), asc(schema.credits.title));
  return (
    <>
      <PageHeader
        title="Film & Theater credits"
        action={{ label: "Add a credit", href: "/admin/credits/new" }}
      />
      {rows.length === 0 ? (
        <EmptyState>
          No credits yet. Add them here and they appear on the Film & Theater
          page once a “credits” section is on it.
        </EmptyState>
      ) : (
        <Table head={["Title", "Type", "Year", "Roles"]}>
          {rows.map((c) => (
            <tr key={c.id}>
              <Td>
                <Link
                  href={`/admin/credits/${c.id}`}
                  className="font-semibold underline"
                >
                  {c.title}
                </Link>
                {c.featured ? (
                  <span className="ml-2 text-xs text-bronze">Featured</span>
                ) : null}
              </Td>
              <Td>{LABEL[c.category]}</Td>
              <Td>{c.year ?? "—"}</Td>
              <Td>{c.roles.join(", ") || "—"}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
