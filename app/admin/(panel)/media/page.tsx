import Link from "next/link";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listMedia } from "@/lib/media/manage";

export default async function MediaPage({
  searchParams,
}: PageProps<"/admin/media">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const kind =
    sp.kind === "image" || sp.kind === "video" || sp.kind === "document"
      ? sp.kind
      : undefined;
  const unused = sp.unused === "1";
  const items = await listMedia({ q, kind, unused, limit: 200 });

  return (
    <>
      <PageHeader
        title="Media Library"
        subtitle="Every photo, video and document on the site."
      />
      <form
        className="mb-6 flex flex-wrap items-end gap-3"
        action="/admin/media"
      >
        <label className="min-w-[14rem] flex-1 text-sm font-semibold">
          Search
          <input
            name="q"
            defaultValue={q}
            placeholder="Description, caption or file name"
            className="mt-1 w-full border border-line bg-white px-3 py-2 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Type
          <select
            name="kind"
            defaultValue={kind ?? ""}
            className="mt-1 block border border-line bg-white px-3 py-2 font-normal"
          >
            <option value="">All</option>
            <option value="image">Photos</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="unused"
            value="1"
            defaultChecked={unused}
            className="h-5 w-5 accent-[#8c6b3f]"
          />{" "}
          Unused only
        </label>
        <button
          type="submit"
          className="border border-bronze-light px-4 py-2 text-sm text-bronze"
        >
          Filter
        </button>
        {q || kind || unused ? (
          <Link
            href="/admin/media"
            className="pb-2 text-sm text-stone underline"
          >
            Clear
          </Link>
        ) : null}
      </form>
      <MediaLibrary
        items={items.map((i) => ({
          ...i,
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
