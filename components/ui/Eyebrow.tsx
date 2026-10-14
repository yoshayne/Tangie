import { cn } from "@/lib/cn";

export function Eyebrow({
  children,
  onDark,
  className,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-eyebrow font-semibold uppercase tracking-[0.18em]",
        onDark ? "text-bronze-light" : "text-bronze-text",
        className,
      )}
    >
      {children}
    </p>
  );
}
