import type { CreditData } from "@/lib/data/credits";
import type { Background, Spacing } from "@/lib/sections/types";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "./SectionShell";

export type CreditsListProps = {
  eyebrow?: string;
  heading?: string;
  credits: CreditData[];
  background?: Background;
  spacing?: Spacing;
};

const GROUPS: Array<{ key: CreditData["category"]; label: string }> = [
  { key: "stage", label: "Stage Plays" },
  { key: "film_tv", label: "Film & TV" },
  { key: "other", label: "Other Work" },
];

export function CreditsList({
  eyebrow,
  heading,
  credits,
  background,
  spacing,
}: CreditsListProps) {
  if (credits.length === 0) return null;
  const dark = background === "ink";
  return (
    <SectionShell background={background} spacing={spacing}>
      {heading ? (
        <SectionHeading eyebrow={eyebrow} heading={heading} onDark={dark} />
      ) : null}
      <div
        className={`${heading ? "mt-10 lg:mt-[calc(var(--u)*56)]" : ""} space-y-14 lg:space-y-[calc(var(--u)*72)]`}
      >
        {GROUPS.map((group) => {
          const items = credits.filter((c) => c.category === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key}>
              <h3 className="mb-6 text-eyebrow font-semibold uppercase tracking-[0.18em] text-bronze">
                {group.label}
              </h3>
              <ul className="border-b border-bronze-light/60">
                {items.map((c) => (
                  <li
                    key={c.id}
                    className={`grid gap-4 border-t border-bronze-light/60 py-6 lg:gap-[calc(var(--u)*32)] lg:py-[calc(var(--u)*32)] ${c.year ? "lg:grid-cols-[calc(var(--u)*120)_1fr_auto]" : "lg:grid-cols-[1fr_auto]"}`}
                  >
                    {c.year ? (
                      <p className="font-display text-h3 font-normal text-bronze">
                        {c.year}
                      </p>
                    ) : null}
                    <div>
                      <h4
                        className={`font-display text-h3 font-normal ${dark ? "text-ivory" : "text-heading"}`}
                      >
                        {c.title}
                      </h4>
                      {c.roles.length > 0 ? (
                        <ul
                          className="mt-3 flex flex-wrap gap-2"
                          aria-label="Roles"
                        >
                          {c.roles.map((r) => (
                            <li
                              key={r}
                              className="border border-bronze-light px-3 py-1 text-eyebrow font-semibold uppercase tracking-[0.14em] text-bronze"
                            >
                              {r}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {c.description ? (
                        <p
                          className={`mt-3 lg:max-w-[calc(var(--u)*760)] text-body ${dark ? "text-ivory/90" : "text-copy"}`}
                        >
                          {c.description}
                        </p>
                      ) : null}
                    </div>
                    {c.watchLinks.length > 0 ? (
                      <div className="flex flex-wrap items-start gap-3">
                        {c.watchLinks.map((l) => (
                          <Button
                            key={l.url}
                            href={l.url}
                            variant="outline"
                            newTab
                            size="sm"
                          >
                            {l.label}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
