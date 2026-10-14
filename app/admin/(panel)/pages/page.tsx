import { asc } from "drizzle-orm";
import Link from "next/link";
import { duplicatePage } from "@/app/admin/actions-pages";
import { DeletePageButton } from "@/components/admin/DeletePageButton";
import { Badge, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export default async function PagesAdmin() {
  await requireAdmin();
  const pages = await getDb()
    .select()
    .from(schema.pages)
    .orderBy(asc(schema.pages.isSystem), asc(schema.pages.title));
  // Custom pages first, then the built-in ones.
  const custom = pages.filter((p) => !p.isSystem);
  const system = pages.filter((p) => p.isSystem);
  const targets: Array<[string, string]> = [
    ["/", "Home page"],
    ...pages
      .filter(
        (p) =>
          p.status === "published" && p.slug && !p.slug.startsWith("_template"),
      )
      .map((p): [string, string] => [`/${p.slug}`, p.title]),
  ];

  const row = (p: (typeof pages)[number]) => (
    <tr key={p.id}>
      <Td>
        <Link href={`/admin/pages/${p.id}`} className="font-semibold underline">
          {p.title}
        </Link>
        {p.isSystem ? (
          <span className="ml-2 text-xs text-stone">built-in</span>
        ) : null}
      </Td>
      <Td>
        {p.slug.startsWith("_template")
          ? "Shown below every item"
          : `/${p.slug}`}
      </Td>
      <Td>
        <Badge tone={p.status === "published" ? "good" : "warn"}>
          {p.status === "published" ? "Published" : "Not published"}
        </Badge>
        {p.draft ? (
          <span className="ml-2">
            <Badge tone="warn">Unpublished changes</Badge>
          </span>
        ) : null}
      </Td>
      <Td>
        {p.updatedAt.toLocaleDateString("en-US", {
          dateStyle: "medium",
          timeZone: "America/New_York",
        })}
      </Td>
      <Td>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href={`/admin/pages/${p.id}`} className="text-bronze underline">
            Edit
          </Link>
          <form action={duplicatePage.bind(null, p.id)}>
            <button className="text-bronze underline">Duplicate</button>
          </form>
          {p.status === "published" && !p.slug.startsWith("_template") ? (
            <Link
              href={`/${p.slug}`}
              target="_blank"
              className="text-stone underline"
            >
              View ↗
            </Link>
          ) : null}
          {!p.isSystem ? (
            <DeletePageButton id={p.id} title={p.title} targets={targets} />
          ) : null}
        </div>
      </Td>
    </tr>
  );

  return (
    <>
      <PageHeader
        title="Pages"
        subtitle="Every page on the website is built from sections you can edit."
        action={{ label: "New page", href: "/admin/pages/new" }}
      />
      {custom.length ? (
        <>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
            Your pages
          </h2>
          <div className="mb-8">
            <Table head={["Page", "Address", "Status", "Last edited", ""]}>
              {custom.map(row)}
            </Table>
          </div>
        </>
      ) : null}
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
        Built-in pages
      </h2>
      <Table head={["Page", "Address", "Status", "Last edited", ""]}>
        {system.map(row)}
      </Table>
    </>
  );
}
