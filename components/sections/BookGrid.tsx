import Image from "next/image";
import Link from "next/link";
import type { BookCardData } from "@/lib/data/books";
import { blurProps, type Background, type Spacing } from "@/lib/sections/types";
import { SectionShell } from "./SectionShell";

export type BookGridProps = {
  books: BookCardData[];
  background?: Background;
  spacing?: Spacing;
};

export function BookGrid({ books, background, spacing }: BookGridProps) {
  if (books.length === 0) return null;
  return (
    <SectionShell background={background} spacing={spacing}>
      <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-[calc(var(--u)*56)] lg:gap-y-[calc(var(--u)*64)]">
        {books.map((b) => (
          <li key={b.slug}>
            <Link href={`/books/${b.slug}`} className="group block">
              <div className="relative mx-auto aspect-[2/3] w-full lg:max-w-[calc(var(--u)*420)] overflow-hidden bg-sand">
                {b.cover ? (
                  <Image
                    src={b.cover.src}
                    alt={b.cover.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, 80vw"
                    {...blurProps(b.cover)}
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : null}
              </div>
              <div className="mx-auto mt-5 lg:max-w-[calc(var(--u)*420)]">
                <span
                  className={`inline-block px-3 py-1 text-eyebrow font-semibold uppercase tracking-[0.16em] ${b.status === "available" ? "bg-bronze text-white" : "border border-bronze-light text-bronze-text"}`}
                >
                  {b.status === "available" ? "Available" : "Coming Soon"}
                </span>
                <h2 className="mt-3 font-display text-h3 font-normal text-heading">
                  {b.title}
                </h2>
                {b.seriesLine ? (
                  <p className="mt-1 text-small text-stone">{b.seriesLine}</p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
