export type SpacerDividerProps = {
  size?: "small" | "medium" | "large";
  rule?: boolean;
};

const SIZE = {
  small: "h-8 lg:h-[calc(var(--u)*32)]",
  medium: "h-16 lg:h-[calc(var(--u)*64)]",
  large: "h-24 lg:h-[calc(var(--u)*112)]",
};

export function SpacerDivider({
  size = "medium",
  rule = false,
}: SpacerDividerProps) {
  return (
    <div
      className={`flex items-center bg-ivory px-4 md:px-6 ${SIZE[size]}`}
      aria-hidden
    >
      {rule ? (
        <div className="mx-auto h-px w-full lg:max-w-[calc(var(--u)*1200)] bg-gold" />
      ) : null}
    </div>
  );
}
