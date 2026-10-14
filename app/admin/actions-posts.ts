"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminAction } from "@/lib/admin/auth";
import { addSlugRedirect, slugTaken } from "@/lib/admin/crud";
import {
  fail,
  parseForm,
  slugify,
  type AdminFormState,
} from "@/lib/admin/form";
import { invalidate } from "@/lib/admin/invalidate";
import { opt, req, uuidOrNull, zonedToDate } from "@/lib/admin/zod";
import { getDb, schema } from "@/lib/db";
import { sanitizeRich } from "@/lib/html";
import { mediaRefsInHtml, setMediaUsage } from "@/lib/media/usage";

const PostForm = z.object({
  title: req("Title"),
  slug: opt(100),
  excerpt: opt(400),
  category: opt(80),
  authorName: req("Author", 120),
  publishedAt: opt(40),
  status: z.enum(["draft", "published"]),
  coverMediaId: uuidOrNull,
  bodyHtml: z.string().optional(),
  seoTitle: opt(120),
  seoDescription: opt(300),
});

export async function savePost(
  id: string | null,
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();
  const parsed = parseForm(PostForm, fd);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  const body = d.bodyHtml ? sanitizeRich(d.bodyHtml) : "";
  if (d.status === "published" && !body)
    return fail("A published post needs some text.", parsed.values, {
      bodyHtml: "Write the post first.",
    });

  const slug = slugify(d.slug ?? d.title);
  if (await slugTaken("posts", slug, id))
    return fail("That web address is already used.", parsed.values, {
      slug: "Choose a different one.",
    });

  let publishedAt: Date | null = d.publishedAt
    ? zonedToDate(d.publishedAt, "America/New_York")
    : null;
  if (publishedAt && Number.isNaN(publishedAt.getTime())) publishedAt = null;
  if (d.status === "published" && !publishedAt) publishedAt = new Date();

  const db = getDb();
  const values = {
    slug,
    title: d.title,
    excerpt: d.excerpt,
    category: d.category,
    authorName: d.authorName,
    publishedAt,
    status: d.status,
    coverMediaId: d.coverMediaId,
    bodyHtml: body,
    seoTitle: d.seoTitle,
    seoDescription: d.seoDescription,
    updatedAt: new Date(),
  };
  let postId = id;
  if (id) {
    const [old] = await db
      .select({ slug: schema.posts.slug })
      .from(schema.posts)
      .where(eq(schema.posts.id, id));
    await db.update(schema.posts).set(values).where(eq(schema.posts.id, id));
    if (old && old.slug !== slug)
      await addSlugRedirect(`/journal/${old.slug}`, `/journal/${slug}`);
  } else {
    const [row] = await db.insert(schema.posts).values(values).returning();
    postId = row.id;
  }
  await setMediaUsage(db, "post", postId!, [
    ...(d.coverMediaId
      ? [{ mediaId: d.coverMediaId, fieldPath: "cover" }]
      : []),
    ...(await mediaRefsInHtml(db, body, "body")),
  ]);
  invalidate(["posts"]);
  if (!id) redirect(`/admin/journal/${postId}`);
  return { status: "success", message: "Post saved." };
}

export async function togglePostStatus(id: string) {
  await requireAdminAction();
  const db = getDb();
  const [p] = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.id, id));
  if (!p) return;
  const publishing = p.status !== "published";
  await db
    .update(schema.posts)
    .set({
      status: publishing ? "published" : "draft",
      publishedAt: publishing ? (p.publishedAt ?? new Date()) : p.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.posts.id, id));
  invalidate(["posts"]);
}

export async function deletePost(id: string) {
  await requireAdminAction();
  const db = getDb();
  await setMediaUsage(db, "post", id, []);
  await db.delete(schema.posts).where(eq(schema.posts.id, id));
  invalidate(["posts"]);
  redirect("/admin/journal");
}
