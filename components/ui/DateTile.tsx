export function DateTile({ month, day }: { month: string; day: string }) {
  return (
    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center bg-tile text-bronze-text lg:h-[calc(var(--u)*88)] lg:w-[calc(var(--u)*88)]">
      <span className="text-[13px] font-semibold uppercase leading-none tracking-[0.04em] lg:text-[calc(var(--u)*19)]">
        {month}
      </span>
      <span className="mt-1 font-display text-[30px] font-semibold leading-none lg:text-[calc(var(--u)*44)]">
        {day}
      </span>
    </div>
  );
}
