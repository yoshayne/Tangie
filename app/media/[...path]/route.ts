import { getObject } from "@/lib/storage";

// Media is stored in a private bucket, so the app serves it from /media/<path>.
// Only files under media/ are public; originals/ is never reachable from here.
const SAFE_PATH =
  /^\d{4}\/\d{2}\/[a-z0-9][a-z0-9._-]*\.(webp|jpg|jpeg|png|avif|mp4|mov|pdf|zip)$/i;

export async function GET(
  request: Request,
  ctx: RouteContext<"/media/[...path]">,
) {
  const { path } = await ctx.params;
  const rel = path.join("/");
  if (!SAFE_PATH.test(rel)) return new Response("Not found", { status: 404 });

  const range = request.headers.get("range");
  const obj = await getObject(`media/${rel}`, range);
  if (!obj) return new Response("Not found", { status: 404 });

  if (obj.etag && request.headers.get("if-none-match") === obj.etag) {
    return new Response(null, { status: 304 });
  }

  const headers = new Headers({
    "Content-Type": obj.contentType,
    // The key contains a uuid and never changes, so browsers and CDNs may keep it forever.
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  });
  if (obj.contentLength != null)
    headers.set("Content-Length", String(obj.contentLength));
  if (obj.contentRange) headers.set("Content-Range", obj.contentRange);
  if (obj.etag) headers.set("ETag", obj.etag);

  return new Response(obj.body, { status: obj.status, headers });
}
