import { Button } from "@/components/ui/Button";
import type { ButtonRef } from "@/lib/sections/types";

export function SectionButtons({
  buttons,
  className,
}: {
  buttons?: ButtonRef[];
  className?: string;
}) {
  if (!buttons?.length) return null;
  return (
    <div
      className={`flex flex-wrap gap-3 lg:gap-[calc(var(--u)*18)] ${className ?? ""}`}
    >
      {buttons.map((b) => (
        <Button
          key={b.label}
          href={b.href}
          variant={b.variant ?? "filled"}
          newTab={b.newTab}
        >
          {b.label}
        </Button>
      ))}
    </div>
  );
}
