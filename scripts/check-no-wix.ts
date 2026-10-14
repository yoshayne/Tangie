/**
 * Fails if anything depends on Wix (CLAUDE.md §5B): scans the code, and every text/jsonb column
 * in the database except media.legacy_url (an audit-only column).
 *
 *   npm run check:wix            code scan; DB scan only if the database is reachable
 *   npm run check:wix:prod       code scan + DB scan, and fails if the DB cannot be reached
 *
 * Runs automatically before `next build` (the build server usually cannot reach the database,
 * so the DB part is skipped there with a warning; run check:wix:prod before launch).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const PATTERN = /wixstatic|tangiebeaty\.com\/_/i;
const requireDb = process.argv.includes("--require-db");

const ROOT = process.cwd();
const SCAN = [
  "app",
  "components",
  "lib",
  "scripts",
  "drizzle",
  "public",
  "next.config.ts",
  "proxy.ts",
  "package.json",
];
// The download script and this one must mention Wix; they are the only allowed places.
const SKIP_FILES = new Set([
  "scripts/check-no-wix.ts",
  "scripts/download-wix-assets.ts",
]);
const TEXT_EXT = /\.(ts|tsx|js|mjs|json|css|html|svg|sql|txt|xml)$/i;

function* walk(p: string): Generator<string> {
  const stat = statSync(p);
  if (stat.isDirectory()) {
    for (const name of readdirSync(p)) yield* walk(path.join(p, name));
  } else {
    yield p;
  }
}

let problems = 0;

for (const entry of SCAN) {
  const abs = path.join(ROOT, entry);
  try {
    statSync(abs);
  } catch {
    continue;
  }
  for (const file of walk(abs)) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    if (SKIP_FILES.has(rel) || !TEXT_EXT.test(rel)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (PATTERN.test(line)) {
        problems++;
        console.error(`Wix reference in code: ${rel}:${i + 1}`);
      }
    });
  }
}

async function checkDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (requireDb) throw new Error("DATABASE_URL is not set");
    console.warn(
      "check-no-wix: DATABASE_URL not set, skipping the database scan",
    );
    return;
  }
  const sql = postgres(url, { max: 1, connect_timeout: 3, onnotice: () => {} });
  try {
    const cols = await sql<{ table_name: string; column_name: string }[]>`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and (data_type in ('text', 'character varying', 'jsonb', 'json') or (data_type = 'ARRAY' and udt_name = '_text'))
        and not (table_name = 'media' and column_name = 'legacy_url')
        and table_name not like '\\_\\_%'`;
    for (const { table_name, column_name } of cols) {
      const rows = await sql.unsafe(
        `select count(*)::int as n from "${table_name}" where "${column_name}"::text ~* 'wixstatic|tangiebeaty\\.com/_'`,
      );
      if (rows[0].n > 0) {
        problems++;
        console.error(
          `Wix reference in database: ${table_name}.${column_name} (${rows[0].n} rows)`,
        );
      }
    }
    console.log(`check-no-wix: scanned ${cols.length} database columns`);
  } catch (e) {
    if (requireDb) throw e;
    console.warn(
      `check-no-wix: database not reachable (${(e as Error).message}), skipping the database scan`,
    );
  } finally {
    await sql.end({ timeout: 1 });
  }
}

async function main() {
  await checkDatabase();
  if (problems > 0) {
    console.error(`\ncheck-no-wix FAILED: ${problems} reference(s) found.`);
    process.exit(1);
  }
  console.log("check-no-wix: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
