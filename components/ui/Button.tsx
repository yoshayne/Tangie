import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "filled" | "outline";
  size?: "md" | "sm";
  /** Use on a dark background so the outline style stays readable. */
  onDark?: boolean;
  newTab?: boolean;
  /** Analytics event to fire when clicked. */
  track?: string;
  /** Hidden extra words that say where the button goes (read by screen readers and search engines). */
  srText?: string;
  className?: string;
  onClick?: () => void;
};

export function Button({
  href,
  children,
  variant = "filled",
  size = "md",
  onDark,
  newTab,
  track,
  srText,
  className,
  onClick,
}: Props) {
  const classes = cn(
    "group/btn relative inline-flex items-center justify-center whitespace-nowrap active:scale-[0.98] text-btn font-semibold uppercase tracking-[0.16em] transition-colors duration-200 ease-in-out",
    size === "md"
      ? "min-h-12 px-8 lg:h-[calc(var(--u)*57)]"
      : "min-h-11 px-6 lg:h-[calc(var(--u)*53)] lg:px-[calc(var(--u)*28)]",
    size === "md" &&
      (variant === "filled"
        ? "lg:px-[calc(var(--u)*38)]"
        : "lg:px-[calc(var(--u)*42)]"),
    variant === "filled"
      ? "bg-bronze text-white after:border-gold hover:bg-accent-hover"
      : cn(
          "border after:border-transparent hover:border-bronze hover:bg-bronze hover:text-white hover:after:border-gold",
          onDark
            ? "border-bronze-light text-ivory"
            : "border-outline text-charcoal",
        ),
    // A fine gold frame just outside the button (its thickness is 0 in themes without gold rules).
    "after:pointer-events-none after:absolute after:-inset-[5px] after:border-[length:var(--rule-h)] after:transition-all after:duration-200 hover:after:-inset-[7px]",
    className,
  );
  return (
    <Link
      href={href}
      className={classes}
      onClick={onClick}
      {...(track ? { "data-track": track } : {})}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {srText ? <span className="sr-only"> {srText}</span> : null}
    </Link>
  );
}
