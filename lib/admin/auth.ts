import { compare, hash } from "bcryptjs";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";

/**
 * Admin sign-in. It stays dormant (the whole /admin area returns "not found") until the three
 * variables below exist, so the live site never exposes an unprotected admin.
 */
export const SESSION_COOKIE = "tb_admin";
const SESSION_DAYS = 7;

/**
 * Until a password is set the admin is OPEN: anyone with the /admin address can use it (a
 * client decision for the build phase). It locks automatically once all three variables exist.
 * Setting ADMIN_DISABLED=true hides the admin completely instead.
 */
export const OPEN_ADMIN_ID = "open";

export function adminDisabled(): boolean {
  return process.env.ADMIN_DISABLED === "true";
}

/** True when a password is required (all three login variables are set). */
export function adminEnabled(): boolean {
  return Boolean(
    process.env.JWT_SECRET &&
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_PASSWORD_HASH,
  );
}

export type AdminSession = { id: string; email: string };

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16)
    throw new Error("JWT_SECRET is missing or too short");
  return new TextEncoder().encode(s);
}

export async function createSession(admin: AdminSession): Promise<string> {
  return new SignJWT({ email: admin.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token || !adminEnabled()) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/** The signed-in admin, or null. */
export async function getAdmin(): Promise<AdminSession | null> {
  // Reading cookies also marks the page as request-time, which keeps admin pages out of the build.
  const jar = await cookies();
  if (adminDisabled()) return null;
  if (!adminEnabled())
    return { id: OPEN_ADMIN_ID, email: "Open access (no password yet)" };
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** For admin pages: sends visitors who are not signed in to the login page. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For server actions: throws unless signed in. Every admin action must call this first. */
export async function requireAdminAction(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not signed in");
  return admin;
}

/**
 * For route handlers (uploads, downloads): checks the session cookie, and for anything that
 * changes data, that the request came from this site (CSRF defence on top of SameSite cookies).
 */
export async function requireAdminRequest(
  request: Request,
): Promise<AdminSession | Response> {
  // The upload routes skip the proxy (it would cap large bodies), so they hide themselves here.
  await headers(); // marks the route as request-time, so it never runs during the build
  if (adminDisabled()) return new Response("Not found", { status: 404 });
  let admin: AdminSession | null;
  if (!adminEnabled()) {
    admin = { id: OPEN_ADMIN_ID, email: "Open access (no password yet)" };
  } else {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const token = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1);
    admin = await verifySession(token);
  }
  if (!admin) return new Response("Unauthorized", { status: 401 });

  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = (await headers()).get("host");
    if (!origin || !host || new URL(origin).host !== host)
      return new Response("Bad origin", { status: 403 });
  }
  return admin;
}

let dummy: Promise<string> | undefined;
const dummyHash = () => (dummy ??= hash("not-a-real-password", 12));

/** Checks an email + password against the admins table. */
export async function verifyLogin(
  email: string,
  password: string,
): Promise<AdminSession | null> {
  const [row] = await getDb()
    .select()
    .from(schema.admins)
    .where(eq(schema.admins.email, email.trim().toLowerCase()))
    .limit(1);
  // Compare against a real (dummy) hash when the email is unknown so timing does not reveal valid emails.
  const ok = await compare(password, row?.passwordHash ?? (await dummyHash()));
  return ok && row ? { id: row.id, email: row.email } : null;
}

// ---------------------------------------------------------------------------
// Preview tokens: short-lived links that let the editor's iframe show an unpublished page.
// ---------------------------------------------------------------------------
// Preview links are signed with JWT_SECRET, or (in open mode, before it exists) a key derived
// from the database address, which only the server knows.
function previewSecret() {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 16) return new TextEncoder().encode(s);
  return new TextEncoder().encode(
    createHash("sha256")
      .update(`preview:${process.env.DATABASE_URL ?? "local"}`)
      .digest("hex"),
  );
}

export async function createPreviewToken(pageId: string): Promise<string> {
  return new SignJWT({ pageId })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("preview")
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(previewSecret());
}

export async function verifyPreviewToken(
  token: string | undefined,
  pageId: string,
): Promise<boolean> {
  if (!token || adminDisabled()) return false;
  try {
    const { payload } = await jwtVerify(token, previewSecret(), {
      algorithms: ["HS256"],
      audience: "preview",
    });
    return payload.pageId === pageId;
  } catch {
    return false;
  }
}
