/**
 * The order pages are listed in the admin: Home first, then the pages in the same order as the
 * website's top menu, then pages made but not in the menu (newest edit first), then the remaining
 * built-in pages, and the "below every book / event / post" stacks last.
 */
type Orderable = {
  slug: string;
  title: string;
  isSystem: boolean;
  updatedAt: Date;
};

type MenuItem = { href: string; sortOrder: number; isButton: boolean };

const REST = ["press", "privacy", "terms", "newsletter-confirmed"];
const TEMPLATES = ["_template/book", "_template/event", "_template/post"];

function rank(p: Orderable, menu: Map<string, MenuItem>): number {
  if (p.slug === "") return 0;
  if (p.slug.startsWith("_template")) {
    const i = TEMPLATES.indexOf(p.slug);
    return 9000 + (i < 0 ? 99 : i);
  }
  const m = menu.get(`/${p.slug}`);
  if (m) return 100 + (m.isButton ? 1000 : m.sortOrder);
  if (!p.isSystem) return 5000;
  const i = REST.indexOf(p.slug);
  return 6000 + (i < 0 ? 99 : i);
}

export function orderPages<T extends Orderable>(
  pages: T[],
  header: MenuItem[],
): T[] {
  const menu = new Map(header.map((m) => [m.href, m]));
  return [...pages].sort(
    (a, b) =>
      rank(a, menu) - rank(b, menu) ||
      b.updatedAt.getTime() - a.updatedAt.getTime() ||
      a.title.localeCompare(b.title),
  );
}

export const inHeaderMenu = (slug: string, header: MenuItem[]) =>
  header.some((m) => m.href === `/${slug}` && !m.isButton);
