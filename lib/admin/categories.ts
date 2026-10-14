import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/** The journal categories chosen in Site Settings (read straight from the database, never cached). */
export async function getCategories(): Promise<string[]> {
  const [row] = await getDb()
    .select()
    .from(schema.siteSettings)
    .where(eq(schema.siteSettings.key, "journal_categories"));
  return (row?.value as string[] | undefined) ?? [];
}
