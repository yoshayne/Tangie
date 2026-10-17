import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { toImageRef } from "@/lib/media/ref";
import type { ImageRef } from "@/lib/sections/types";

export type CreditData = {
  id: string;
  title: string;
  category: "stage" | "film" | "tv" | "other";
  roles: string[];
  year: number | null;
  description: string | null;
  image: ImageRef | null;
  watchLinks: Array<{ label: string; url: string }>;
  featured: boolean;
};

export async function getCredits(opts: {
  category?: "stage" | "film" | "tv" | "other";
  featuredOnly?: boolean;
}): Promise<CreditData[]> {
  "use cache";
  cacheLife("max");
  cacheTag("credits");

  const rows = await getDb()
    .select({ credit: schema.credits, image: schema.media })
    .from(schema.credits)
    .leftJoin(schema.media, eq(schema.credits.imageMediaId, schema.media.id))
    .where(
      and(
        opts.category ? eq(schema.credits.category, opts.category) : undefined,
        opts.featuredOnly ? eq(schema.credits.featured, true) : undefined,
      ),
    )
    .orderBy(asc(schema.credits.sortOrder));
  return rows.map(({ credit: c, image }) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    roles: c.roles,
    year: c.year,
    description: c.description,
    image: image ? toImageRef(image) : null,
    watchLinks: c.watchLinks,
    featured: c.featured,
  }));
}
