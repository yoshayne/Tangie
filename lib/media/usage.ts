import { and, eq } from "drizzle-orm";
import type { getDb } from "@/lib/db";
import { schema } from "@/lib/db";

type Db = ReturnType<typeof getDb>;
type EntityType = (typeof schema.mediaUsage.$inferInsert)["entityType"];

/** Finds every `{ mediaId }` reference inside a JSON value, with its field path. */
export function findMediaRefs(
  value: unknown,
  path = "",
): Array<{ mediaId: string; fieldPath: string }> {
  const out: Array<{ mediaId: string; fieldPath: string }> = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => out.push(...findMediaRefs(v, `${path}[${i}]`)));
  } else if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.mediaId === "string")
      out.push({ mediaId: obj.mediaId, fieldPath: path });
    for (const [k, v] of Object.entries(obj)) {
      if (k !== "mediaId")
        out.push(...findMediaRefs(v, path ? `${path}.${k}` : k));
    }
  }
  return out;
}

/** Replaces the usage rows for one entity. Called on every save so "Used on" stays accurate. */
export async function setMediaUsage(
  db: Db,
  entityType: EntityType,
  entityId: string,
  refs: Array<{ mediaId: string; fieldPath: string }>,
) {
  await db
    .delete(schema.mediaUsage)
    .where(
      and(
        eq(schema.mediaUsage.entityType, entityType),
        eq(schema.mediaUsage.entityId, entityId),
      ),
    );
  if (refs.length) {
    await db
      .insert(schema.mediaUsage)
      .values(refs.map((r) => ({ ...r, entityType, entityId })));
  }
}
