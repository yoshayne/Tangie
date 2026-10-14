"use client";

import { useCallback, useEffect, useState } from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import type { NavItem } from "@/lib/site-data";
import { MobileMenu } from "./MobileMenu";
import { ActiveNavList, NavList } from "./NavList";

export function Header({
  items,
  cta,
}: {
  items: NavItem[];
  cta: NavItem | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 h-20 bg-ivory transition-colors duration-200 lg:h-[calc(var(--u)*96)] ${scrolled ? "border-b border-line" : "border-b border-transparent"}`}
    >
      <div className="relative mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 md:px-6 lg:px-[calc(var(--u)*83)]">
        <Wordmark />
        <nav
          aria-label="Primary"
          className="hidden lg:absolute lg:left-[33.333%] lg:block"
        >
          <Suspense fallback={<NavList items={items} pathname={null} />}>
            <ActiveNavList items={items} />
          </Suspense>
        </nav>
        <div className="flex items-center gap-2">
          {cta ? (
            <div className="hidden lg:block">
              <Button href={cta.href} size="sm">
                {cta.label}
              </Button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-11 w-11 items-center justify-center text-charcoal lg:hidden"
          >
            <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
              <path
                d="M3 7h18M3 12h18M3 17h18"
                stroke="currentColor"
                strokeWidth={1.5}
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>
      <MobileMenu open={open} onClose={close} items={items} cta={cta} />
    </header>
  );
}
