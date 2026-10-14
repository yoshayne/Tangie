import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { toImageRef } from "@/lib/media/ref";
import type { ImageRef } from "@/lib/sections/types";

export type TestimonialData = {
  quote: string;
  name: string;
  org: string | null;
  portrait: ImageRef | null;
};

/** Approved testimonials only. */
export async function getTestimonials(
  context?: "speaking" | "book",
): Promise<TestimonialData[]> {
  "use cache";
  cacheLife("max");
  cacheTag("testimonials");

  const rows = await getDb()
    .select({ t: schema.testimonials, portrait: schema.media })
    .from(schema.testimonials)
    .leftJoin(
      schema.media,
      eq(schema.testimonials.portraitMediaId, schema.media.id),
    )
    .where(
      and(
        eq(schema.testimonials.approved, true),
        context ? eq(schema.testimonials.context, context) : undefined,
      ),
    )
    .orderBy(asc(schema.testimonials.sortOrder));
  return rows.map(({ t, portrait }) => ({
    quote: t.quote,
    name: t.name,
    org: t.org,
    portrait: portrait ? toImageRef(portrait) : null,
  }));
}
