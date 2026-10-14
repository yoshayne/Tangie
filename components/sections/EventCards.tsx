import { ArrowLink } from "@/components/ui/ArrowLink";
import { EventCard, type EventCardData } from "@/components/ui/EventCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export type EventCardsProps = {
  eyebrow: string;
  heading: string;
  linkLabel: string;
  linkHref: string;
  events: EventCardData[];
  emptyText: string;
  emptyLinkLabel: string;
  emptyLinkHref: string;
};

export function EventCards({
  eyebrow,
  heading,
  linkLabel,
  linkHref,
  events,
  emptyText,
  emptyLinkLabel,
  emptyLinkHref,
}: EventCardsProps) {
  return (
    <section className="bg-ivory-soft px-4 pb-12 pt-12 md:px-6 lg:px-0 lg:pb-[calc(var(--u)*59)] lg:pt-[calc(var(--u)*25)]">
      <div className="mx-auto max-w-[1440px] lg:pl-[calc(var(--u)*91)] lg:pr-[calc(var(--u)*73)]">
        <div className="flex items-start justify-between gap-4">
          <SectionHeading eyebrow={eyebrow} heading={heading} />
          <div className="hidden sm:block lg:mt-[calc(var(--u)*34)]">
            <ArrowLink href={linkHref}>{linkLabel}</ArrowLink>
          </div>
        </div>
        {events.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-3 lg:mt-[calc(var(--u)*9)] lg:gap-[calc(var(--u)*26)]">
            {events.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4 bg-ivory-deep p-6 md:flex-row md:items-center md:justify-between lg:mt-[calc(var(--u)*9)] lg:min-h-[calc(var(--u)*132)] lg:px-[calc(var(--u)*36)]">
            <p className="text-body text-copy">{emptyText}</p>
            <ArrowLink href={emptyLinkHref}>{emptyLinkLabel}</ArrowLink>
          </div>
        )}
        <div className="mt-5 sm:hidden">
          <ArrowLink href={linkHref}>{linkLabel}</ArrowLink>
        </div>
      </div>
    </section>
  );
}
