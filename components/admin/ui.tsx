import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-heading">{title}</h1>
        {subtitle ? <p className="mt-1 text-stone">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="bg-bronze px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#9a3d12]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-line bg-white p-5">
      {title ? (
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-line bg-white px-6 py-12 text-center text-stone">
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn";
}) {
  const cls =
    tone === "good"
      ? "bg-[#eff8f0] text-[#2f6b3a]"
      : tone === "warn"
        ? "bg-[#fff6e5] text-[#8a5a00]"
        : "bg-[#efece6] text-stone";
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

/** A plain responsive table. */
export function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto border border-line bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-[#faf8f4] text-xs uppercase tracking-[0.12em] text-stone">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
