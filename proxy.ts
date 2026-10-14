import { NextResponse, type NextRequest } from "next/server";
import { getRoutingSnapshot } from "@/lib/routing/lookup";

/**
 * Runs before every page request:
 *  1. database redirects (from the `redirects` table, e.g. created when a page is renamed)
 *  2. a real 404 status for addresses that do not exist (the page itself can only report 200
 *     once it has started streaming)
 * The admin login check is added in M6.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const snap = await getRoutingSnapshot().catch(() => null);
  if (!snap) return NextResponse.next(); // database unavailable: never block the site

  const redirect = snap.redirects.get(path);
  if (redirect) {
    return NextResponse.redirect(
      new URL(redirect.to, request.url),
      redirect.status,
    );
  }

  // Only judge addresses once the database has returned something, so a half-set-up site
  // does not 404 everything.
  if (snap.known.size > 0 && !snap.known.has(path)) {
    return NextResponse.rewrite(new URL("/not-found-page", request.url), {
      status: 404,
    });
  }
  return NextResponse.next();
}

export const config = {
  // Skip assets and utility routes: Next internals, photos, health check, files with an extension.
  matcher: [
    "/((?!_next/|media/|health|favicon\\.ico|.*\\.[a-zA-Z0-9]{2,5}$).*)",
  ],
};
