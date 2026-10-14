import { asc } from "drizzle-orm";
import { NavigationForm } from "@/components/admin/SiteForms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export default async function NavigationAdmin() {
  await requireAdmin();
  const db = getDb();
  const [items, pages] = await Promise.all([
    db.select().from(schema.navItems).orderBy(asc(schema.navItems.sortOrder)),
    db.select({ slug: schema.pages.slug }).from(schema.pages),
  ]);
  const map = (loc: "header" | "footer") =>
    items
      .filter((i) => i.location === loc && !i.isButton)
      .map((i) => ({ label: i.label, href: i.href }));
  const cta = items.find((i) => i.location === "header" && i.isButton);
  return (
    <>
      <PageHeader
        title="Navigation"
        subtitle="The menus in the header and footer."
      />
      <NavigationForm
        pages={pages.map((p) => `/${p.slug}`)}
        defaults={{
          header: map("header"),
          footer: map("footer"),
          ctaLabel: cta?.label ?? "",
          ctaHref: cta?.href ?? "",
        }}
      />
    </>
  );
}
