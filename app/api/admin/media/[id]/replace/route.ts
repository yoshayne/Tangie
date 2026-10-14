import { requireAdminRequest } from "@/lib/admin/auth";
import { invalidate, tagsForMedia } from "@/lib/admin/invalidate";
import { replaceImageFile } from "@/lib/media/manage";
import { inspectFile } from "@/lib/media/validate";

/** Swap a photo's file but keep its id: every page using it updates at once. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/media/[id]/replace">,
) {
  const admin = await requireAdminRequest(request);
  if (admin instanceof Response) return admin;
  const { id } = await ctx.params;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return Response.json({ error: "No file received." }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const verdict = await inspectFile(buffer.subarray(0, 4100), buffer.length);
  if (!verdict.ok)
    return Response.json({ error: verdict.error }, { status: 400 });
  if (verdict.kind !== "image")
    return Response.json(
      { error: "Please choose an image file." },
      { status: 400 },
    );

  try {
    const row = await replaceImageFile(id, buffer, file.name);
    invalidate(await tagsForMedia(id), "route");
    return Response.json({
      media: { id: row.id, url: row.url, width: row.width, height: row.height },
    });
  } catch (e) {
    console.error("Replace failed:", e);
    return Response.json(
      { error: "That photo couldn't be replaced." },
      { status: 500 },
    );
  }
}
