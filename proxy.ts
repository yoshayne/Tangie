import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, adminDisabled, adminEnabled } from "@/lib/admin/auth";
import { getRoutingSnapshot } from "@/lib/routing/lookup";

/**
 * Runs before every page request:
 *  1. database redirects (from the `redirects` table, e.g. created when a page is renamed)
 *  2. a real 404 status for addresses that do not exist (the page itself can only report 200
 *     once it has started streaming)
 * 3. the admin guard (see below)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  // Admin area. With no password set it is open (client decision for the build phase); once
  // JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD_HASH exist this becomes a quick cookie check, and
  // every admin page, action and API route also verifies the session itself. ADMIN_DISABLED=true
  // hides the whole area (404).
  if (
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path.startsWith("/api/admin/")
  ) {
    const isApi = path.startsWith("/api/");
    if (adminDisabled()) {
      return isApi
        ? new NextResponse("Not found", { status: 404 })
        : NextResponse.rewrite(new URL("/not-found-page", request.url));
    }
    // With a password set, a missing cookie goes to the login page. Without one (open mode)
    // everything is reachable.
    if (
      adminEnabled() &&
      path !== "/admin/login" &&
      !request.cookies.get(SESSION_COOKIE)
    ) {
      return isApi
        ? new NextResponse("Unauthorized", { status: 401 })
        : NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // The builder's preview pages check the admin session and a signed link themselves.
  if (path.startsWith("/preview/")) return NextResponse.next();

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
    "/((?!_next/|media/|health|favicon\\.ico|api/admin/media/|.*\\.[a-zA-Z0-9]{2,5}$).*)",
  ],
};
