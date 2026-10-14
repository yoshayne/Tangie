import type { Background, Spacing } from "@/lib/sections/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "./SectionShell";

export type DownloadsProps = {
  eyebrow?: string;
  heading?: string;
  items: Array<{
    label: string;
    description?: string;
    url: string;
    fileType?: string;
    sizeLabel?: string;
  }>;
  background?: Background;
  spacing?: Spacing;
};

export function Downloads({
  eyebrow,
  heading,
  items,
  background,
  spacing,
}: DownloadsProps) {
  const dark = background === "ink";
  return (
    <SectionShell background={background} spacing={spacing}>
      {heading ? (
        <SectionHeading eyebrow={eyebrow} heading={heading} onDark={dark} />
      ) : null}
      <ul
        className={`grid gap-4 sm:grid-cols-2 ${heading ? "mt-10 lg:mt-[calc(var(--u)*48)]" : ""} lg:gap-[calc(var(--u)*24)]`}
      >
        {items.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              download
              className="group flex items-center justify-between gap-6 border border-line bg-white p-5 transition-colors duration-200 hover:border-bronze lg:p-[calc(var(--u)*28)]"
            >
              <span className="min-w-0">
                <span className="block font-display text-card-title font-medium text-heading">
                  {item.label}
                </span>
                {item.description ? (
                  <span className="mt-1 block text-small text-stone">
                    {item.description}
                  </span>
                ) : null}
                {item.fileType || item.sizeLabel ? (
                  <span className="mt-2 block text-eyebrow font-semibold uppercase tracking-[0.18em] text-bronze-text">
                    {[item.fileType, item.sizeLabel]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
              </span>
              <span
                aria-hidden
                className="shrink-0 text-bronze-text transition-transform duration-200 group-hover:translate-y-0.5"
              >
                ↓
              </span>
            </a>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
