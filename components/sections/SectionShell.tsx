import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Background, Spacing } from "@/lib/sections/types";

const BG: Record<Background, string> = {
  ivory: "bg-ivory text-charcoal",
  "ivory-deep": "bg-ivory-deep text-charcoal",
  sand: "bg-sand text-charcoal",
  white: "bg-white text-charcoal",
  ink: "bg-ink text-ivory",
};

const PAD: Record<Spacing, string> = {
  compact: "py-10 lg:py-[calc(var(--u)*48)]",
  normal: "py-14 lg:py-[calc(var(--u)*96)]",
  spacious: "py-20 lg:py-[calc(var(--u)*128)]",
};

/**
 * Wrapper every content section sits in. It owns the background colour, vertical spacing
 * and page gutters, so the page builder only ever offers approved choices (CLAUDE.md §6B).
 */
export function SectionShell({
  background = "ivory",
  spacing = "normal",
  children,
  className,
  innerClassName,
}: {
  background?: Background;
  spacing?: Spacing;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <section className={cn(BG[background], PAD[spacing], className)}>
      <div
        className={cn(
          "mx-auto max-w-[1440px] px-4 md:px-6 lg:px-[calc(var(--u)*120)]",
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export const isDark = (bg?: Background) => bg === "ink";
