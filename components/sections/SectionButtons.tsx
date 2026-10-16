import { Button } from "@/components/ui/Button";
import type { ButtonRef } from "@/lib/sections/types";

export function SectionButtons({
  buttons,
  className,
  onDark,
}: {
  buttons?: ButtonRef[];
  className?: string;
  onDark?: boolean;
}) {
  if (!buttons?.length) return null;
  return (
    <div
      className={`flex flex-wrap gap-4 lg:gap-[calc(var(--u)*24)] ${className ?? ""}`}
    >
      {buttons.map((b) => (
        <Button
          key={b.label}
          href={b.href}
          variant={b.variant ?? "filled"}
          onDark={onDark}
          newTab={b.newTab}
          track={b.track}
          srText={b.srText}
        >
          {b.label}
        </Button>
      ))}
    </div>
  );
}
