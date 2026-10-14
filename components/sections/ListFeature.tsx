import type { Background, Spacing } from "@/lib/sections/types";
import { FeatureIcon, type FeatureIconName } from "@/components/ui/FeatureIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "./SectionShell";

export type ListFeatureProps = {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  items: Array<{ title: string; text?: string; icon?: FeatureIconName }>;
  columns?: 1 | 2 | 3;
  background?: Background;
  spacing?: Spacing;
};

const COLS = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" };

export function ListFeature({
  eyebrow,
  heading,
  intro,
  items,
  columns = 3,
  background,
  spacing,
}: ListFeatureProps) {
  const dark = background === "ink";
  return (
    <SectionShell background={background} spacing={spacing}>
      {heading ? (
        <SectionHeading eyebrow={eyebrow} heading={heading} onDark={dark} />
      ) : null}
      {intro ? (
        <p
          className={`mt-5 lg:max-w-[calc(var(--u)*760)] text-body ${dark ? "text-ivory/90" : "text-copy"}`}
        >
          {intro}
        </p>
      ) : null}
      <ul
        className={`grid gap-x-10 gap-y-8 ${heading || intro ? "mt-10 lg:mt-[calc(var(--u)*56)]" : ""} ${COLS[columns]} lg:gap-x-[calc(var(--u)*56)] lg:gap-y-[calc(var(--u)*44)]`}
      >
        {items.map((item) => (
          <li
            key={item.title}
            className="flex gap-4 border-t border-bronze-light/60 pt-5 lg:pt-[calc(var(--u)*24)]"
          >
            {item.icon && item.icon !== "none" ? (
              <FeatureIcon
                name={item.icon}
                className="mt-1 h-6 w-6 shrink-0 text-bronze-text"
              />
            ) : null}
            <div>
              <h3
                className={`font-display text-h3 font-normal ${dark ? "text-ivory" : "text-heading"}`}
              >
                {item.title}
              </h3>
              {item.text ? (
                <p
                  className={`mt-2 text-body ${dark ? "text-ivory/85" : "text-copy"}`}
                >
                  {item.text}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
