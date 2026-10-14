import { sanitizeRich } from "@/lib/html";
import type { Background, Spacing } from "@/lib/sections/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "./SectionShell";

export type FaqProps = {
  eyebrow?: string;
  heading?: string;
  items: Array<{ question: string; answer: string }>;
  background?: Background;
  spacing?: Spacing;
};

/** Accessible accordion built on <details>/<summary> (keyboard and screen-reader friendly, no script). */
export function Faq({
  eyebrow,
  heading,
  items,
  background,
  spacing,
}: FaqProps) {
  const dark = background === "ink";
  return (
    <SectionShell background={background} spacing={spacing}>
      <div className="lg:max-w-[calc(var(--u)*920)]">
        {heading ? (
          <SectionHeading eyebrow={eyebrow} heading={heading} onDark={dark} />
        ) : null}
        <div
          className={`${heading ? "mt-10 lg:mt-[calc(var(--u)*48)]" : ""} border-b border-bronze-light/60`}
        >
          {items.map((item) => (
            <details
              key={item.question}
              className="group border-t border-bronze-light/60"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-h3 font-normal marker:hidden lg:py-[calc(var(--u)*26)] [&::-webkit-details-marker]:hidden">
                <span className={dark ? "text-ivory" : "text-heading"}>
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className="text-2xl leading-none text-bronze transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div
                className={`prose prose-site pb-6 ${dark ? "text-ivory/90" : ""}`}
                dangerouslySetInnerHTML={{ __html: sanitizeRich(item.answer) }}
              />
            </details>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
