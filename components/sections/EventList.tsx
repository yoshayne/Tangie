import Image from "next/image";
import Link from "next/link";
import type { EventListData } from "@/lib/data/events";
import { sanitizeRich } from "@/lib/html";
import {
  blurProps,
  focalToPosition,
  type Background,
  type Spacing,
} from "@/lib/sections/types";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { EventCard } from "@/components/ui/EventCard";
import { SectionShell } from "./SectionShell";

export type EventListProps = {
  data: EventListData;
  scope: "upcoming" | "past" | "both";
  emptyText: string;
  emptyLinkLabel: string;
  emptyLinkHref: string;
  background?: Background;
  spacing?: Spacing;
};

export function EventList({
  data,
  scope,
  emptyText,
  emptyLinkLabel,
  emptyLinkHref,
  background,
  spacing,
}: EventListProps) {
  return (
    <SectionShell background={background} spacing={spacing}>
      {scope !== "past" ? (
        <div>
          <h2 className="mb-6 text-eyebrow font-semibold uppercase tracking-[0.18em] text-bronze">
            Upcoming Events
          </h2>
          {data.upcoming.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-[calc(var(--u)*26)]">
              {data.upcoming.map((e) => (
                <EventCard key={e.slug} event={e} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4 bg-ivory-deep p-6 md:flex-row md:items-center md:justify-between lg:px-[calc(var(--u)*36)] lg:py-[calc(var(--u)*40)]">
              <p className="text-body text-copy">{emptyText}</p>
              <ArrowLink href={emptyLinkHref}>{emptyLinkLabel}</ArrowLink>
            </div>
          )}
        </div>
      ) : null}

      {scope !== "upcoming" && data.past.length > 0 ? (
        <div
          className={scope === "both" ? "mt-16 lg:mt-[calc(var(--u)*88)]" : ""}
        >
          <h2 className="mb-6 text-eyebrow font-semibold uppercase tracking-[0.18em] text-bronze">
            Past Events
          </h2>
          <div className="border-b border-bronze-light/60">
            {data.past.map((e) => (
              <details
                key={e.slug}
                className="group border-t border-bronze-light/60"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 marker:hidden lg:py-[calc(var(--u)*28)] [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block font-display text-h3 font-normal text-heading">
                      {e.title}
                    </span>
                    <span className="mt-1 block text-small text-stone">
                      {e.dateLabel}
                      {e.location ? ` · ${e.location}` : ""}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="text-2xl leading-none text-bronze transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="grid gap-8 pb-8 lg:grid-cols-[calc(var(--u)*360)_1fr] lg:gap-[calc(var(--u)*56)]">
                  {e.image ? (
                    <div className="relative aspect-[2/3] w-full lg:max-w-[calc(var(--u)*360)] overflow-hidden bg-sand">
                      <Image
                        src={e.image.src}
                        alt={e.image.alt}
                        fill
                        sizes="360px"
                        {...blurProps(e.image)}
                        className="object-cover"
                        style={{
                          objectPosition: focalToPosition(e.image.focal),
                        }}
                      />
                    </div>
                  ) : null}
                  <div className={e.image ? "" : "lg:col-span-2"}>
                    <div
                      className="prose prose-site"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeRich(
                          e.recapHtml ?? e.descriptionHtml ?? "",
                        ),
                      }}
                    />
                    <p className="mt-6">
                      <Link
                        href={`/events/${e.slug}`}
                        className="text-link font-semibold uppercase tracking-[0.16em] text-bronze"
                      >
                        View event page →
                      </Link>
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : null}
    </SectionShell>
  );
}
