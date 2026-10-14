import Link from "next/link";
import { cn } from "@/lib/cn";

export function ArrowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-link font-semibold uppercase tracking-[0.16em] text-bronze-text",
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        className="transition-transform duration-200 ease-in-out group-hover:translate-x-[3px]"
      >
        →
      </span>
    </Link>
  );
}
