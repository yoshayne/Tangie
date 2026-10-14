"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import type { NavItem } from "@/lib/site-data";

type Props = {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  cta: NavItem | null;
};

// The panel only exists while open, so reading the URL here never blocks the prebuilt page shell.
export function MobileMenu({ open, ...rest }: Props) {
  return open ? <MobileMenuPanel {...rest} /> : null;
}

function MobileMenuPanel({ onClose, items, cta }: Omit<Props, "open">) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>("a[href], button") ?? [],
      );
    focusable()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="fixed inset-0 z-50 flex flex-col bg-ivory px-4 pb-8 pt-0 lg:hidden"
    >
      <div className="flex h-20 items-center justify-between">
        <Wordmark />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-11 w-11 items-center justify-center text-charcoal"
        >
          <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
            <path
              d="M5 5l14 14M19 5L5 19"
              stroke="currentColor"
              strokeWidth={1.5}
              fill="none"
            />
          </svg>
        </button>
      </div>
      <nav aria-label="Mobile" className="mt-8 flex-1">
        <ul className="flex flex-col gap-5">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`font-display text-[34px] font-normal leading-tight ${active ? "text-bronze" : "text-charcoal"}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {cta ? (
        <Button href={cta.href} onClick={onClose} className="w-full">
          {cta.label}
        </Button>
      ) : null}
    </div>
  );
}
