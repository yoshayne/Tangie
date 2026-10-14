import { eq } from "drizzle-orm";
import { requireAdminRequest } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import { getObject } from "@/lib/storage";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/admin/media/[id]/original">,
) {
  const admin = await requireAdminRequest(request);
  if (admin instanceof Response) return admin;
  const { id } = await ctx.params;

  const [row] = await getDb()
    .select()
    .from(schema.media)
    .where(eq(schema.media.id, id))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  const obj = await getObject(row.originalKey ?? row.key);
  if (!obj) return new Response("Not found", { status: 404 });

  const name = (row.originalFilename ?? "download").replace(/[^\w.\- ]+/g, "_");
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.contentType,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
