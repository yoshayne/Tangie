import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "filled" | "outline";
  size?: "md" | "sm";
  newTab?: boolean;
  /** Analytics event to fire when clicked. */
  track?: string;
  className?: string;
  onClick?: () => void;
};

export function Button({
  href,
  children,
  variant = "filled",
  size = "md",
  newTab,
  track,
  className,
  onClick,
}: Props) {
  const classes = cn(
    "inline-flex items-center justify-center whitespace-nowrap text-btn font-semibold uppercase tracking-[0.16em] transition-colors duration-200 ease-in-out",
    size === "md"
      ? "min-h-12 px-8 lg:h-[calc(var(--u)*57)]"
      : "min-h-11 px-6 lg:h-[calc(var(--u)*53)] lg:px-[calc(var(--u)*28)]",
    size === "md" &&
      (variant === "filled"
        ? "lg:px-[calc(var(--u)*38)]"
        : "lg:px-[calc(var(--u)*42)]"),
    variant === "filled"
      ? "bg-bronze text-white hover:bg-[#815f36]"
      : "border border-bronze-light text-charcoal hover:border-bronze hover:bg-bronze hover:text-white",
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
    </Link>
  );
}
