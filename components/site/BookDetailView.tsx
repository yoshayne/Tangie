import Image from "next/image";
import type { BookDetail } from "@/lib/data/books";
import { sanitizeRich } from "@/lib/html";
import { blurProps } from "@/lib/sections/types";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function BookDetailView({ book }: { book: BookDetail }) {
  const series = book.seriesName
    ? book.seriesOrder
      ? `${book.seriesName} · Book ${book.seriesOrder}`
      : book.seriesName
    : null;
  return (
    <section className="bg-ivory px-4 pb-16 pt-12 md:px-6 lg:px-[calc(var(--u)*120)] lg:pb-[calc(var(--u)*112)] lg:pt-[calc(var(--u)*88)]">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[calc(var(--u)*460)_1fr] lg:gap-[calc(var(--u)*96)]">
        <div className="lg:sticky lg:top-[calc(var(--u)*128)] lg:self-start">
          {book.cover ? (
            <div className="relative mx-auto aspect-[2/3] w-full max-w-[420px] overflow-hidden bg-sand lg:max-w-none">
              <Image
                src={book.cover.src}
                alt={book.cover.alt}
                fill
                priority
                sizes="(min-width: 1024px) 32vw, 90vw"
                {...blurProps(book.cover)}
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
        <div>
          {series ? <Eyebrow>{series}</Eyebrow> : null}
          <h1 className="mt-4 font-display text-page-h1 font-normal text-heading">
            {book.title}
          </h1>
          {book.subtitle ? (
            <p className="mt-3 font-display text-h3 font-normal text-copy">
              {book.subtitle}
            </p>
          ) : null}
          {book.tagline ? (
            <p className="mt-4 font-display text-h3 font-normal italic text-bronze">
              {book.tagline}
            </p>
          ) : null}
          {book.synopsisHtml ? (
            <div
              className="prose prose-site mt-8 lg:mt-[calc(var(--u)*40)]"
              dangerouslySetInnerHTML={{
                __html: sanitizeRich(book.synopsisHtml),
              }}
            />
          ) : null}

          <div
            id="buy"
            className="mt-10 scroll-mt-28 lg:mt-[calc(var(--u)*48)]"
          >
            {book.status === "coming_soon" ? (
              <p className="mb-5 text-eyebrow font-semibold uppercase tracking-[0.18em] text-bronze">
                Coming soon
              </p>
            ) : null}
            {book.links.length > 0 ? (
              <div className="flex flex-wrap gap-3 lg:gap-[calc(var(--u)*18)]">
                {book.links.map((l, i) => (
                  <Button
                    key={l.url}
                    href={l.url}
                    variant={i === 0 ? "filled" : "outline"}
                    newTab
                    track="book_purchase_click"
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="lg:max-w-[calc(var(--u)*620)] text-body text-copy">
                {/* TODO(client): purchase links (Stripe Payment Link and/or retailers) */}
                Purchase links are on the way. Join the mailing list below to
                hear first.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3 lg:gap-[calc(var(--u)*18)]">
              <Button href="/contact?type=books" variant="outline">
                Book club inquiry
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
