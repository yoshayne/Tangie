"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { HEADER_NAV } from "@/lib/site-data";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const pathname = usePathname();
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
          <ul className="flex items-center gap-[calc(var(--u)*37.5)]">
            {HEADER_NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`border-b pb-1 text-nav font-medium text-[#3d3a3a] ${active ? "border-bronze" : "border-transparent"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <Button href="/contact" size="sm">
              Contact
            </Button>
          </div>
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
      <MobileMenu open={open} onClose={close} pathname={pathname} />
    </header>
  );
}
