import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { toImageRef } from "@/lib/media/ref";
import type { EventCardData } from "@/components/ui/EventCard";
import type { ImageRef } from "@/lib/sections/types";
import { longDate, monthDay } from "./format";

type EventRow = typeof schema.events.$inferSelect;

function location(e: EventRow) {
  return e.isVirtual
    ? "Virtual Event"
    : [e.city, e.state].filter(Boolean).join(", ");
}

function card(e: EventRow): EventCardData {
  const { month, day } = monthDay(e.startsAt, e.timezone);
  return { slug: e.slug, title: e.title, month, day, location: location(e) };
}

/** Next published events that have not happened yet. Cached for an hour so past events drop off. */
export async function getUpcomingEvents(
  count: number,
): Promise<EventCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("events");

  const rows = await getDb()
    .select()
    .from(schema.events)
    .where(
      and(
        eq(schema.events.published, true),
        gte(schema.events.startsAt, new Date()),
      ),
    )
    .orderBy(asc(schema.events.startsAt))
    .limit(count);
  return rows.map(card);
}

export type PastEvent = {
  slug: string;
  title: string;
  dateLabel: string;
  location: string;
  image: ImageRef | null;
  recapHtml: string | null;
  descriptionHtml: string | null;
};

export type EventListData = { upcoming: EventCardData[]; past: PastEvent[] };

export async function getEventList(
  scope: "upcoming" | "past" | "both",
): Promise<EventListData> {
  "use cache";
  cacheLife("hours");
  cacheTag("events");

  const db = getDb();
  const now = new Date();
  const upcoming =
    scope === "past"
      ? []
      : await db
          .select()
          .from(schema.events)
          .where(
            and(
              eq(schema.events.published, true),
              gte(schema.events.startsAt, now),
            ),
          )
          .orderBy(asc(schema.events.startsAt));
  const pastRows =
    scope === "upcoming"
      ? []
      : await db
          .select({ event: schema.events, image: schema.media })
          .from(schema.events)
          .leftJoin(
            schema.media,
            eq(schema.events.imageMediaId, schema.media.id),
          )
          .where(
            and(
              eq(schema.events.published, true),
              lt(schema.events.startsAt, now),
            ),
          )
          .orderBy(desc(schema.events.startsAt));

  return {
    upcoming: upcoming.map(card),
    past: pastRows.map(({ event: e, image }) => ({
      slug: e.slug,
      title: e.title,
      dateLabel: longDate(e.startsAt, e.timezone),
      location: [e.venueName, location(e)].filter(Boolean).join(" · "),
      image: image ? toImageRef(image) : null,
      recapHtml: e.recapHtml,
      descriptionHtml: e.descriptionHtml,
    })),
  };
}

export type EventDetail = {
  slug: string;
  title: string;
  startsAtIso: string;
  endsAtIso: string | null;
  timezone: string;
  dateLabel: string;
  timeLabel: string;
  venueName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  isVirtual: boolean;
  descriptionHtml: string | null;
  recapHtml: string | null;
  registrationUrl: string | null;
  image: ImageRef | null;
  isPast: boolean;
};

export async function getEventDetail(
  slug: string,
): Promise<EventDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("events");

  const [row] = await getDb()
    .select({ event: schema.events, image: schema.media })
    .from(schema.events)
    .leftJoin(schema.media, eq(schema.events.imageMediaId, schema.media.id))
    .where(and(eq(schema.events.slug, slug), eq(schema.events.published, true)))
    .limit(1);
  if (!row) {
    cacheLife("seconds");
    return null;
  }
  const e = row.event;
  const time = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: e.timezone,
      timeZoneName: "short",
    }).format(d);
  return {
    slug: e.slug,
    title: e.title,
    startsAtIso: e.startsAt.toISOString(),
    endsAtIso: e.endsAt?.toISOString() ?? null,
    timezone: e.timezone,
    dateLabel: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: e.timezone,
    }).format(e.startsAt),
    timeLabel: e.endsAt
      ? `${time(e.startsAt).replace(/ [A-Z]{2,4}$/, "")} – ${time(e.endsAt)}`
      : time(e.startsAt),
    venueName: e.venueName,
    address: e.address,
    city: e.city,
    state: e.state,
    isVirtual: e.isVirtual,
    descriptionHtml: e.descriptionHtml,
    recapHtml: e.recapHtml,
    registrationUrl: e.registrationUrl,
    image: row.image ? toImageRef(row.image) : null,
    isPast: e.startsAt.getTime() < Date.now(),
  };
}
