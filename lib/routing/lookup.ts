import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

type Redirect = { to: string; status: 301 | 302 | 307 | 308 };
export type RoutingSnapshot = {
  at: number;
  redirects: Map<string, Redirect>;
  known: Set<string>;
};

const TTL_MS = 30_000;
const g = globalThis as unknown as {
  __routing?: RoutingSnapshot | null;
  __routingLoad?: Promise<RoutingSnapshot | null> | null;
};

async function load(): Promise<RoutingSnapshot | null> {
  try {
    const db = getDb();
    const [redirectRows, pages, books, events, posts] = await Promise.all([
      db.select().from(schema.redirects),
      db
        .select({ slug: schema.pages.slug })
        .from(schema.pages)
        .where(eq(schema.pages.status, "published")),
      db
        .select({ slug: schema.books.slug })
        .from(schema.books)
        .where(eq(schema.books.published, true)),
      db
        .select({ slug: schema.events.slug })
        .from(schema.events)
        .where(eq(schema.events.published, true)),
      db
        .select({ slug: schema.posts.slug })
        .from(schema.posts)
        .where(and(eq(schema.posts.status, "published"))),
    ]);

    const known = new Set<string>();
    for (const p of pages) {
      if (p.slug.startsWith("_template")) continue;
      known.add(p.slug === "" ? "/" : `/${p.slug}`);
    }
    for (const b of books) known.add(`/books/${b.slug}`);
    for (const e of events) known.add(`/events/${e.slug}`);
    for (const p of posts) known.add(`/journal/${p.slug}`);

    const redirects = new Map<string, Redirect>();
    for (const r of redirectRows) {
      const status = [301, 302, 307, 308].includes(r.statusCode)
        ? (r.statusCode as Redirect["status"])
        : 301;
      redirects.set(r.fromPath, { to: r.toPath, status });
    }
    return { at: Date.now(), redirects, known };
  } catch (e) {
    console.error("routing lookup failed:", (e as Error).message);
    return null;
  }
}

/**
 * Redirects and the list of real addresses, kept in memory and refreshed every 30 seconds
 * (immediately after an admin change, via `bumpRoutingCache`). If the database cannot be reached
 * the last good copy is used, and with none at all the proxy simply lets every request through.
 */
export async function getRoutingSnapshot(): Promise<RoutingSnapshot | null> {
  const current = g.__routing ?? null;
  if (current && Date.now() - current.at < TTL_MS) return current;
  if (!g.__routingLoad) {
    g.__routingLoad = load()
      .then((s) => {
        if (s) g.__routing = s;
        return g.__routing ?? null;
      })
      .finally(() => {
        g.__routingLoad = null;
      });
  }
  return g.__routingLoad;
}

/** Call after saving a page, redirect, book, event or post so changes show up straight away. */
export function bumpRoutingCache() {
  g.__routing = null;
}
