import Link from "next/link";
import { cn } from "@/lib/cn";

export function Wordmark({
  light,
  className,
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex flex-col",
        light ? "text-ivory" : "text-charcoal",
        className,
      )}
    >
      <span className="font-display text-wm font-normal uppercase tracking-[0.04em]">
        Tangie
      </span>
      <span className="mt-[max(6px,calc(var(--u)*8))] font-display text-wm-sub font-normal uppercase tracking-[0.28em]">
        Brickhouse-Beaty
      </span>
      <span className="sr-only">(home)</span>
    </Link>
  );
}
