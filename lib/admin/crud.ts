import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/** True when another row of the table already uses this slug. */
export async function slugTaken(
  table: "books" | "events" | "posts",
  slug: string,
  exceptId?: string | null,
): Promise<boolean> {
  const t = schema[table];
  const rows = await getDb()
    .select({ id: t.id })
    .from(t)
    .where(and(eq(t.slug, slug), exceptId ? ne(t.id, exceptId) : undefined))
    .limit(1);
  return rows.length > 0;
}

/** Keeps old links working: /books/old-name → /books/new-name (301). */
export async function addSlugRedirect(from: string, to: string) {
  if (from === to) return;
  await getDb()
    .insert(schema.redirects)
    .values({ fromPath: from, toPath: to, statusCode: 301 })
    .onConflictDoUpdate({
      target: schema.redirects.fromPath,
      set: { toPath: to },
    });
}

export function sortOrderOf(n: number | null | undefined) {
  return Number.isFinite(n) ? (n as number) : 0;
}
