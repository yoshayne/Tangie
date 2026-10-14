"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  /** Phones only: the bar slides away while reading down and returns on the first scroll up. */
  const [tucked, setTucked] = useState(false);
  const progress = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 4);
      const delta = y - last;
      if (y < 80) setTucked(false);
      else if (Math.abs(delta) > 6) setTucked(delta > 0);
      if (Math.abs(delta) > 6) last = y;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress.current)
        progress.current.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, y / max)) : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      onFocusCapture={() => setTucked(false)}
      className={`sticky top-0 z-40 h-20 bg-ivory transition-[background-color,border-color,transform] duration-300 lg:h-[calc(var(--u)*96)] ${tucked && !open ? "max-lg:-translate-y-full" : ""} ${scrolled ? "border-b border-line" : "border-b border-transparent"}`}
    >
      <div
        ref={progress}
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-bronze lg:hidden"
      />
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
