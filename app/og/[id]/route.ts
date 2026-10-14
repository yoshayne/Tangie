import sharp from "sharp";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getObject } from "@/lib/storage";

const W = 1200;
const H = 630;

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * The picture shown when a page is shared on social media: a 1200×630 JPEG made from one of the
 * site's photos, framed around its focus point. JPEG, because every social site accepts it.
 */
export async function GET(request: Request, ctx: RouteContext<"/og/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return new Response("Not found", { status: 404 });

  const [m] = await getDb()
    .select()
    .from(schema.media)
    .where(eq(schema.media.id, id))
    .limit(1);
  if (!m || m.kind !== "image")
    return new Response("Not found", { status: 404 });

  const obj = await getObject(m.key);
  if (!obj) return new Response("Not found", { status: 404 });
  const input = await readAll(obj.body);

  const contain = new URL(request.url).searchParams.get("fit") === "contain";
  let out: Buffer;
  if (contain) {
    // The whole picture on a sand background.
    const fitted = await sharp(input)
      .resize({ height: H - 80, fit: "inside", withoutEnlargement: false })
      .toBuffer();
    out = await sharp({
      create: { width: W, height: H, channels: 3, background: "#D6EAE6" },
    })
      .composite([{ input: fitted, gravity: "centre" }])
      .jpeg({ quality: 84 })
      .toBuffer();
  } else {
    const meta = await sharp(input).metadata();
    const w = meta.width ?? W;
    const h = meta.height ?? H;
    const scale = Math.max(W / w, H / h);
    const rw = Math.max(W, Math.round(w * scale));
    const rh = Math.max(H, Math.round(h * scale));
    const left = Math.min(
      rw - W,
      Math.max(0, Math.round(m.focalX * rw - W / 2)),
    );
    const top = Math.min(
      rh - H,
      Math.max(0, Math.round(m.focalY * rh - H / 2)),
    );
    out = await sharp(input)
      .resize(rw, rh)
      .extract({ left, top, width: W, height: H })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
  }

  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      // The address carries a version that changes with the file, so a day is safe.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
