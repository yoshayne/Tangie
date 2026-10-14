import { cn } from "@/lib/cn";
import { Eyebrow } from "./Eyebrow";

type Props = {
  eyebrow?: string;
  /** Pass line breaks as "\n". */
  heading: string;
  italic?: boolean;
  /** "h2" is the standard section size; "feature" and "compact" match the mockup's larger and smaller headings. */
  size?: "h2" | "feature" | "compact" | "page";
  onDark?: boolean;
  level?: 1 | 2;
  className?: string;
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  h2: "text-h2",
  feature: "text-h2-feat",
  compact: "text-h2-news",
  page: "text-page-h1",
};

export function SectionHeading({
  eyebrow,
  heading,
  italic,
  size = "h2",
  onDark,
  level = 2,
  className,
}: Props) {
  const Tag = level === 1 ? "h1" : "h2";
  const lines = heading.split("\n");
  return (
    <div className={className}>
      {eyebrow ? <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow> : null}
      <Tag
        className={cn(
          "font-display font-normal",
          SIZE[size],
          eyebrow &&
            (size === "compact"
              ? "mt-[max(12px,calc(var(--u)*16))]"
              : "mt-[max(12px,calc(var(--u)*21))]"),
          italic && "italic",
          onDark ? "text-ivory" : "text-heading",
        )}
      >
        {lines.map((line, i) => (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </Tag>
    </div>
  );
}
