import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { toImageRef } from "./ref";

/** Loads the photo for an image field's id (or null). */
export async function getMediaById(id: string | null | undefined) {
  if (!id) return null;
  const [row] = await getDb()
    .select()
    .from(schema.media)
    .where(eq(schema.media.id, id))
    .limit(1);
  return row ?? null;
}

export { toImageRef };
