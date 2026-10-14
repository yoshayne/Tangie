import { and, asc, eq, gte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import type { EventCardData } from "@/components/ui/EventCard";
import { monthDay } from "./format";

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

  return rows.map((e) => {
    const { month, day } = monthDay(e.startsAt, e.timezone);
    return {
      slug: e.slug,
      title: e.title,
      month,
      day,
      location: e.isVirtual
        ? "Virtual Event"
        : [e.city, e.state].filter(Boolean).join(", "),
    };
  });
}
