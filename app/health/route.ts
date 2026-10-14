import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { emailConfigured, newsletterConfigured } from "@/lib/email/brevo";
import { redisConfigured } from "@/lib/forms/rate-limit";
import { turnstileEnabled } from "@/lib/forms/turnstile";
import { getObject, storageDriverName } from "@/lib/storage";

/** Never leak connection strings or keys in a diagnostic message. */
function safeError(e: unknown) {
  const err = e as {
    message?: string;
    code?: string;
    cause?: { message?: string; code?: string };
  };
  const cause = err.cause ?? err;
  return {
    code: cause.code ?? err.code ?? null,
    message: String(cause.message ?? err.message ?? e)
      .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]+/gi, "[url]")
      .split("\n")[0]
      .slice(0, 200),
  };
}

// /health            -> {"ok":true}  (is the server up)
// /health?deep=1     -> also checks the database, content and file storage
export async function GET(request: Request) {
  if (!new URL(request.url).searchParams.has("deep")) {
    return Response.json({ ok: true });
  }
  await connection();

  const result: Record<string, unknown> = {};
  try {
    const db = getDb();
    const tables = await db.execute(
      sql`select count(*)::int as n from information_schema.tables where table_schema = 'public'`,
    );
    result.database = { ok: true, tables: (tables[0] as { n: number }).n };
    try {
      const pages = await db.execute(sql`select count(*)::int as n from pages`);
      const sections = await db.execute(
        sql`select count(*)::int as n from sections`,
      );
      const media = await db.execute(sql`select count(*)::int as n from media`);
      result.content = {
        pages: (pages[0] as { n: number }).n,
        sections: (sections[0] as { n: number }).n,
        media: (media[0] as { n: number }).n,
      };
    } catch (e) {
      result.content = {
        ok: false,
        hint: "tables missing: setup has not run yet",
        ...safeError(e),
      };
    }
  } catch (e) {
    result.database = { ok: false, ...safeError(e) };
  }

  try {
    await getObject("media/healthcheck-does-not-exist.webp");
    result.storage = { ok: true, driver: storageDriverName() };
  } catch (e) {
    result.storage = {
      ok: false,
      driver: storageDriverName(),
      ...safeError(e),
    };
  }

  // Which optional services are switched on (true/false only, never the keys themselves).
  result.services = {
    brevoEmail: emailConfigured(),
    brevoNewsletter: newsletterConfigured(),
    turnstile: turnstileEnabled(),
    redis: redisConfigured(),
  };

  const ok =
    (result.database as { ok?: boolean }).ok === true &&
    (result.storage as { ok?: boolean }).ok === true;
  return Response.json({ ok, ...result }, { status: ok ? 200 : 503 });
}
