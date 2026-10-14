import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import type { NavItem, SocialLink } from "@/lib/site-data";

export type PageData = {
  id: string;
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  sections: Array<{
    id: string;
    type: string;
    props: Record<string, unknown>;
    anchorId: string | null;
    hidden: boolean;
  }>;
};

/** A published page and its live section stack. Returns null when the page does not exist. */
export async function getPage(slug: string): Promise<PageData | null> {
  "use cache";
  cacheLife("max");
  cacheTag(`page:${slug}`);

  const db = getDb();
  const [page] = await db
    .select()
    .from(schema.pages)
    .where(
      and(eq(schema.pages.slug, slug), eq(schema.pages.status, "published")),
    )
    .limit(1);
  if (!page) {
    // Do not remember "not found" for long: the content may simply not have been loaded yet.
    cacheLife("seconds");
    return null;
  }

  const rows = await db
    .select()
    .from(schema.sections)
    .where(
      and(
        eq(schema.sections.pageId, page.id),
        eq(schema.sections.isDraftNew, false),
      ),
    )
    .orderBy(asc(schema.sections.sortOrder));

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    sections: rows.map((s) => ({
      id: s.id,
      type: s.type,
      props: s.props,
      anchorId: s.anchorId,
      hidden: s.hidden,
    })),
  };
}

export type SiteChrome = {
  headerNav: NavItem[];
  headerCta: NavItem | null;
  footerNav: NavItem[];
  social: SocialLink[];
  affiliates: NavItem[];
};

/** Header/footer data: navigation from `nav_items`, links from `site_settings`. */
export async function getSiteChrome(): Promise<SiteChrome> {
  "use cache";
  cacheLife("max");
  cacheTag("nav", "settings");

  const db = getDb();
  const nav = await db
    .select()
    .from(schema.navItems)
    .orderBy(asc(schema.navItems.sortOrder));
  const settings = await db.select().from(schema.siteSettings);
  const setting = <T>(key: string, fallback: T): T =>
    (settings.find((s) => s.key === key)?.value as T | undefined) ?? fallback;

  // An empty navigation table means setup has not finished; do not remember that for long.
  if (nav.length === 0) cacheLife("seconds");

  const header = nav.filter((n) => n.location === "header");
  return {
    headerNav: header
      .filter((n) => !n.isButton)
      .map((n) => ({ label: n.label, href: n.href })),
    headerCta: header.find((n) => n.isButton)
      ? {
          label: header.find((n) => n.isButton)!.label,
          href: header.find((n) => n.isButton)!.href,
        }
      : null,
    footerNav: nav
      .filter((n) => n.location === "footer")
      .map((n) => ({ label: n.label, href: n.href })),
    social: setting<SocialLink[]>("social", []),
    affiliates: setting<NavItem[]>("affiliates", []),
  };
}
