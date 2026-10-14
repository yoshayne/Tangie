import type { Background, Spacing } from "@/lib/sections/types";
import { SectionShell } from "./SectionShell";

export type StatsRowProps = {
  items: Array<{ value: string; label: string }>;
  background?: Background;
  spacing?: Spacing;
};

export function StatsRow({ items, background, spacing }: StatsRowProps) {
  const dark = background === "ink";
  return (
    <SectionShell background={background} spacing={spacing}>
      <dl className="grid gap-10 text-center sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))] lg:gap-[calc(var(--u)*48)]">
        {items.map((s) => (
          <div key={s.label}>
            <dd
              className={`font-display text-stat font-normal ${dark ? "text-ivory" : "text-heading"}`}
            >
              {s.value}
            </dd>
            <dt
              className={`mt-3 text-eyebrow font-semibold uppercase tracking-[0.18em] ${dark ? "text-bronze-light" : "text-bronze-text"}`}
            >
              {s.label}
            </dt>
          </div>
        ))}
      </dl>
    </SectionShell>
  );
}
