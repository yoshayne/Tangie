"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminAction } from "@/lib/admin/auth";
import { fail, parseForm, type AdminFormState } from "@/lib/admin/form";
import { invalidate } from "@/lib/admin/invalidate";
import {
  bool,
  int,
  opt,
  optInt,
  req,
  rows,
  url,
  uuidOrNull,
} from "@/lib/admin/zod";
import { getDb, schema } from "@/lib/db";
import { setMediaUsage } from "@/lib/media/usage";

// ---------------- Credits (Film & Theater) ----------------
const CreditForm = z.object({
  title: req("Title"),
  category: z.enum(["stage", "film_tv", "other"]),
  roles: opt(300),
  year: optInt("Year"),
  description: opt(1200),
  imageMediaId: uuidOrNull,
  watchLinks: rows(
    z.object({
      label: z.string().trim().max(80),
      url: z.string().trim().max(500),
    }),
  ),
  featured: bool,
  sortOrder: int("Order"),
});

export async function saveCredit(
  id: string | null,
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();
  const parsed = parseForm(CreditForm, fd);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  const links = d.watchLinks.filter((l) => l.label || l.url);
  for (const l of links)
    if (!l.label || !url("Link", true).safeParse(l.url).success)
      return fail(
        "Each watch link needs a label and an address starting with https://",
        parsed.values,
        { watchLinks: "Check the watch links." },
      );
  const db = getDb();
  const values = {
    title: d.title,
    category: d.category,
    roles: (d.roles ?? "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean),
    year: d.year,
    description: d.description,
    imageMediaId: d.imageMediaId,
    watchLinks: links,
    featured: d.featured,
    sortOrder: d.sortOrder,
  };
  let creditId = id;
  if (id)
    await db
      .update(schema.credits)
      .set(values)
      .where(eq(schema.credits.id, id));
  else
    creditId = (await db.insert(schema.credits).values(values).returning())[0]
      .id;
  await setMediaUsage(
    db,
    "credit",
    creditId!,
    d.imageMediaId ? [{ mediaId: d.imageMediaId, fieldPath: "image" }] : [],
  );
  invalidate(["credits"]);
  if (!id) redirect(`/admin/credits/${creditId}`);
  return { status: "success", message: "Credit saved." };
}

export async function deleteCredit(id: string) {
  await requireAdminAction();
  const db = getDb();
  await setMediaUsage(db, "credit", id, []);
  await db.delete(schema.credits).where(eq(schema.credits.id, id));
  invalidate(["credits"]);
  redirect("/admin/credits");
}

// ---------------- Speaking topics ----------------
const TopicForm = z.object({
  title: req("Title"),
  description: opt(800),
  sortOrder: int("Order"),
});

export async function saveTopic(
  id: string | null,
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();
  const parsed = parseForm(TopicForm, fd);
  if (!parsed.ok) return parsed.state;
  const db = getDb();
  if (id)
    await db
      .update(schema.speakingTopics)
      .set(parsed.data)
      .where(eq(schema.speakingTopics.id, id));
  else {
    const [row] = await db
      .insert(schema.speakingTopics)
      .values(parsed.data)
      .returning();
    invalidate(["topics"]);
    redirect(`/admin/topics/${row.id}`);
  }
  invalidate(["topics"]);
  return { status: "success", message: "Topic saved." };
}

export async function deleteTopic(id: string) {
  await requireAdminAction();
  await getDb()
    .delete(schema.speakingTopics)
    .where(eq(schema.speakingTopics.id, id));
  invalidate(["topics"]);
  redirect("/admin/topics");
}

// ---------------- Testimonials ----------------
const TestimonialForm = z.object({
  quote: req("Quote", 1500),
  name: req("Name", 120),
  org: opt(160),
  portraitMediaId: uuidOrNull,
  context: z.enum(["speaking", "book"]),
  approved: bool,
  sortOrder: int("Order"),
});

export async function saveTestimonial(
  id: string | null,
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();
  const parsed = parseForm(TestimonialForm, fd);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  const db = getDb();
  let tid = id;
  if (id)
    await db
      .update(schema.testimonials)
      .set(d)
      .where(eq(schema.testimonials.id, id));
  else tid = (await db.insert(schema.testimonials).values(d).returning())[0].id;
  await setMediaUsage(
    db,
    "testimonial",
    tid!,
    d.portraitMediaId
      ? [{ mediaId: d.portraitMediaId, fieldPath: "portrait" }]
      : [],
  );
  invalidate(["testimonials"]);
  if (!id) redirect(`/admin/testimonials/${tid}`);
  return { status: "success", message: "Testimonial saved." };
}

export async function toggleTestimonialApproved(id: string) {
  await requireAdminAction();
  const db = getDb();
  const [t] = await db
    .select()
    .from(schema.testimonials)
    .where(eq(schema.testimonials.id, id));
  if (!t) return;
  await db
    .update(schema.testimonials)
    .set({ approved: !t.approved })
    .where(eq(schema.testimonials.id, id));
  invalidate(["testimonials"]);
}

export async function deleteTestimonial(id: string) {
  await requireAdminAction();
  const db = getDb();
  await setMediaUsage(db, "testimonial", id, []);
  await db.delete(schema.testimonials).where(eq(schema.testimonials.id, id));
  invalidate(["testimonials"]);
  redirect("/admin/testimonials");
}
