import { eq } from "drizzle-orm";
import Link from "next/link";
import { duplicatePage } from "@/app/admin/actions-pages";
import { DeletePageButton } from "@/components/admin/DeletePageButton";
import { Badge, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import { inHeaderMenu, orderPages } from "@/lib/page-builder/order";

export default async function PagesAdmin() {
  await requireAdmin();
  const db = getDb();
  const [rows, nav] = await Promise.all([
    db.select().from(schema.pages),
    db
      .select()
      .from(schema.navItems)
      .where(eq(schema.navItems.location, "header")),
  ]);
  const menu = nav.map((n) => ({
    href: n.href,
    sortOrder: n.sortOrder,
    isButton: n.isButton,
  }));
  const pages = orderPages(rows, menu);
  const site = pages.filter((p) => !p.slug.startsWith("_template"));
  const stacks = pages.filter((p) => p.slug.startsWith("_template"));
  const targets: Array<[string, string]> = [
    ["/", "Home page"],
    ...site
      .filter((p) => p.status === "published" && p.slug)
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
        {inHeaderMenu(p.slug, menu) ? (
          <span className="ml-2">
            <Badge>In menu</Badge>
          </span>
        ) : null}
      </Td>
      <Td>
        {p.slug.startsWith("_template")
          ? "Shown below every item"
          : p.slug
            ? `/${p.slug}`
            : "/ (home)"}
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
              href={p.slug ? `/${p.slug}` : "/"}
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
        subtitle="Every page on the website, in the same order as the menu. Home is always first."
        action={{ label: "New page", href: "/admin/pages/new" }}
      />
      <Table head={["Page", "Address", "Status", "Last edited", ""]}>
        {site.map(row)}
      </Table>
      {stacks.length ? (
        <>
          <h2 className="mb-2 mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
            Shown below every book, event and journal post
          </h2>
          <Table head={["Page", "Address", "Status", "Last edited", ""]}>
            {stacks.map(row)}
          </Table>
        </>
      ) : null}
    </>
  );
}
