import Link from "next/link";
import { DateTile } from "./DateTile";
import { ArrowLink } from "./ArrowLink";

export type EventCardData = {
  slug: string;
  title: string;
  month: string;
  day: string;
  location: string;
};

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <article className="flex items-center gap-4 bg-ivory-deep p-4 lg:gap-[calc(var(--u)*32)] lg:p-[calc(var(--u)*13)]">
      <DateTile month={event.month} day={event.day} />
      <div className="min-w-0">
        <h3 className="font-display text-card-title font-semibold text-[#222]">
          <Link href={`/events/${event.slug}`}>{event.title}</Link>
        </h3>
        <p className="mt-1 text-card-meta text-stone">{event.location}</p>
        <ArrowLink href={`/events/${event.slug}`} className="mt-3">
          View details
        </ArrowLink>
      </div>
    </article>
  );
}
