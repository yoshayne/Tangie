import { requireAdminRequest } from "@/lib/admin/auth";
import { listMedia } from "@/lib/media/manage";

export async function GET(request: Request) {
  const admin = await requireAdminRequest(request);
  if (admin instanceof Response) return admin;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const items = await listMedia({
    q: url.searchParams.get("q") ?? undefined,
    kind:
      kind === "image" || kind === "video" || kind === "document"
        ? kind
        : undefined,
    unused: url.searchParams.get("unused") === "1",
    limit: Math.min(Number(url.searchParams.get("limit")) || 120, 300),
  });
  return Response.json(items);
}
