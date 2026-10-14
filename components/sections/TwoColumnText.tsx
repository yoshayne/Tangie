import { sanitizeRich } from "@/lib/html";
import type { Background, Spacing } from "@/lib/sections/types";
import { SectionShell } from "./SectionShell";

export type TwoColumnTextProps = {
  left: { heading?: string; body: string };
  right: { heading?: string; body: string };
  background?: Background;
  spacing?: Spacing;
};

export function TwoColumnText({
  left,
  right,
  background,
  spacing,
}: TwoColumnTextProps) {
  return (
    <SectionShell background={background} spacing={spacing}>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-[calc(var(--u)*80)]">
        {[left, right].map((col, i) => (
          <div key={i}>
            {col.heading ? (
              <h2 className="mb-5 font-display text-h3 font-normal text-heading lg:mb-[calc(var(--u)*24)]">
                {col.heading}
              </h2>
            ) : null}
            <div
              className="prose prose-site"
              dangerouslySetInnerHTML={{ __html: sanitizeRich(col.body) }}
            />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
