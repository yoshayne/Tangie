"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/site-data";

function isActive(href: string, pathname: string | null) {
  if (pathname === null) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** The desktop navigation links. `pathname` is null until the real URL is known. */
export function NavList({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string | null;
}) {
  return (
    <ul className="flex items-center gap-[calc(var(--u)*37.5)]">
      {items.map((item) => {
        const active = isActive(item.href, pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`border-b pb-1 text-nav font-medium text-[var(--copy-strong)] ${active ? "border-bronze" : "border-transparent"}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Reads the URL, so it must sit inside <Suspense> (the page shell is prebuilt without it). */
export function ActiveNavList({ items }: { items: NavItem[] }) {
  return <NavList items={items} pathname={usePathname()} />;
}
