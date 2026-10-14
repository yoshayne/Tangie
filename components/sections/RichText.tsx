import { sanitizeRich } from "@/lib/html";
import type { Background, Spacing } from "@/lib/sections/types";
import { SectionShell } from "./SectionShell";

export type RichTextProps = {
  body: string;
  maxWidth?: "narrow" | "wide";
  align?: "left" | "center";
  background?: Background;
  spacing?: Spacing;
};

export function RichText({
  body,
  maxWidth = "narrow",
  align = "left",
  background,
  spacing,
}: RichTextProps) {
  return (
    <SectionShell background={background} spacing={spacing}>
      <div
        className={`prose prose-site ${maxWidth === "narrow" ? "lg:max-w-[calc(var(--u)*760)]" : "lg:max-w-[calc(var(--u)*1000)]"} ${align === "center" ? "mx-auto text-center" : ""}`}
        dangerouslySetInnerHTML={{ __html: sanitizeRich(body) }}
      />
    </SectionShell>
  );
}
