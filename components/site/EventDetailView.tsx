import Image from "next/image";
import type { EventDetail } from "@/lib/data/events";
import { sanitizeRich } from "@/lib/html";
import { blurProps } from "@/lib/sections/types";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ShareLinks } from "./ShareLinks";

export function EventDetailView({
  event,
  url,
}: {
  event: EventDetail;
  url: string;
}) {
  const place = [event.venueName, event.address].filter(Boolean).join(", ");
  const maps = place
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
    : null;
  return (
    <section className="bg-ivory px-4 pb-16 pt-12 md:px-6 lg:px-[calc(var(--u)*120)] lg:pb-[calc(var(--u)*112)] lg:pt-[calc(var(--u)*88)]">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_calc(var(--u)*420)] lg:gap-[calc(var(--u)*96)]">
        <div>
          <Eyebrow>{event.isPast ? "Past event" : "Upcoming event"}</Eyebrow>
          <h1 className="mt-4 font-display text-page-h1 font-normal text-heading">
            {event.title}
          </h1>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:mt-[calc(var(--u)*40)]">
            <div>
              <dt className="text-eyebrow font-semibold uppercase tracking-[0.18em] text-bronze">
                When
              </dt>
              <dd className="mt-2 text-body text-heading">
                {event.dateLabel}
                <br />
                {event.timeLabel}
              </dd>
            </div>
            <div>
              <dt className="text-eyebrow font-semibold uppercase tracking-[0.18em] text-bronze">
                Where
              </dt>
              <dd className="mt-2 text-body text-heading">
                {event.isVirtual ? (
                  "Virtual event"
                ) : (
                  <>
                    {event.venueName}
                    <br />
                    {event.address}
                    {maps ? (
                      <>
                        <br />
                        <a
                          href={maps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link font-semibold uppercase tracking-[0.16em] text-bronze"
                        >
                          View on map →
                        </a>
                      </>
                    ) : null}
                  </>
                )}
              </dd>
            </div>
          </dl>

          {event.descriptionHtml ? (
            <div
              className="prose prose-site mt-10 lg:mt-[calc(var(--u)*48)]"
              dangerouslySetInnerHTML={{
                __html: sanitizeRich(event.descriptionHtml),
              }}
            />
          ) : null}
          {event.recapHtml ? (
            <div className="mt-12 lg:mt-[calc(var(--u)*64)]">
              <h2 className="mb-5 text-eyebrow font-semibold uppercase tracking-[0.18em] text-bronze">
                Recap
              </h2>
              <div
                className="prose prose-site"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRich(event.recapHtml),
                }}
              />
            </div>
          ) : null}

          {event.registrationUrl && !event.isPast ? (
            <div className="mt-10">
              <Button href={event.registrationUrl} newTab>
                Register
              </Button>
            </div>
          ) : null}
          <div className="mt-12 border-t border-bronze-light/60 pt-6">
            <ShareLinks url={url} title={event.title} />
          </div>
        </div>
        {event.image ? (
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[420px] overflow-hidden bg-sand lg:max-w-none">
            <Image
              src={event.image.src}
              alt={event.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 30vw, 90vw"
              {...blurProps(event.image)}
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
