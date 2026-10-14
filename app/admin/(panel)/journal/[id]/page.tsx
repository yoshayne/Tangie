import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePost } from "@/app/admin/actions-posts";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PostForm } from "@/components/admin/PostForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCategories } from "@/lib/admin/categories";
import { dateToZonedInput } from "@/lib/admin/zod";
import { getDb, schema } from "@/lib/db";
import { getMediaById } from "@/lib/media/refs";

export default async function EditPost({
  params,
}: PageProps<"/admin/journal/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [p] = await getDb()
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.id, id));
  if (!p) notFound();
  const cover = await getMediaById(p.coverMediaId);
  const categories = await getCategories();
  if (p.category && !categories.includes(p.category))
    categories.push(p.category);
  return (
    <>
      <PageHeader title={p.title} subtitle={`/journal/${p.slug}`} />
      {p.status === "published" ? (
        <p className="mb-6 text-sm">
          <Link
            href={`/journal/${p.slug}`}
            target="_blank"
            className="text-bronze underline"
          >
            View on the website ↗
          </Link>
        </p>
      ) : null}
      <PostForm
        id={id}
        categories={categories}
        cover={cover ? { id: cover.id, url: cover.url, alt: cover.alt } : null}
        defaults={{
          ...p,
          category: p.category ?? "",
          publishedAt: dateToZonedInput(p.publishedAt, "America/New_York"),
        }}
      />
      <div className="mt-10 border-t border-line pt-6">
        <DeleteButton
          action={deletePost.bind(null, id)}
          label="Delete this post"
          confirmText={`Delete “${p.title}” for good?`}
        />
      </div>
    </>
  );
}
