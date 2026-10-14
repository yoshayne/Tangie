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
import { bool, opt, req, url, uuidOrNull, zonedToDate } from "@/lib/admin/zod";
import { getDb, schema } from "@/lib/db";
import { sanitizeRich } from "@/lib/html";
import { EVENT_ZONES } from "@/lib/admin/zones";
import { mediaRefsInHtml, setMediaUsage } from "@/lib/media/usage";

const EventForm = z.object({
  title: req("Title"),
  slug: opt(100),
  startsAt: req("Start date and time", 40),
  endsAt: opt(40),
  timezone: z.enum(EVENT_ZONES.map(([v]) => v) as [string, ...string[]]),
  venueName: opt(160),
  address: opt(240),
  city: opt(100),
  state: opt(40),
  isVirtual: bool,
  descriptionHtml: z.string().optional(),
  recapHtml: z.string().optional(),
  imageMediaId: uuidOrNull,
  registrationUrl: url("Registration link"),
  published: bool,
});

export async function saveEvent(
  id: string | null,
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();
  const parsed = parseForm(EventForm, fd);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;

  const startsAt = zonedToDate(d.startsAt, d.timezone);
  const endsAt = d.endsAt ? zonedToDate(d.endsAt, d.timezone) : null;
  if (Number.isNaN(startsAt.getTime()))
    return fail("Please pick a valid start date.", parsed.values, {
      startsAt: "Pick a date and time.",
    });
  if (endsAt && endsAt < startsAt)
    return fail("The end time is before the start time.", parsed.values, {
      endsAt: "End must be after the start.",
    });

  const slug = slugify(d.slug ?? d.title);
  if (await slugTaken("events", slug, id))
    return fail("That web address is already used.", parsed.values, {
      slug: "Choose a different one.",
    });

  const db = getDb();
  const description = d.descriptionHtml
    ? sanitizeRich(d.descriptionHtml)
    : null;
  const recap = d.recapHtml ? sanitizeRich(d.recapHtml) : null;
  const values = {
    slug,
    title: d.title,
    startsAt,
    endsAt,
    timezone: d.timezone,
    venueName: d.venueName,
    address: d.address,
    city: d.city,
    state: d.state,
    isVirtual: d.isVirtual,
    descriptionHtml: description,
    recapHtml: recap,
    imageMediaId: d.imageMediaId,
    registrationUrl: d.registrationUrl,
    published: d.published,
    updatedAt: new Date(),
  };
  let eventId = id;
  if (id) {
    const [old] = await db
      .select({ slug: schema.events.slug })
      .from(schema.events)
      .where(eq(schema.events.id, id));
    await db.update(schema.events).set(values).where(eq(schema.events.id, id));
    if (old && old.slug !== slug)
      await addSlugRedirect(`/events/${old.slug}`, `/events/${slug}`);
  } else {
    const [row] = await db.insert(schema.events).values(values).returning();
    eventId = row.id;
  }
  await setMediaUsage(db, "event", eventId!, [
    ...(d.imageMediaId
      ? [{ mediaId: d.imageMediaId, fieldPath: "image" }]
      : []),
    ...(await mediaRefsInHtml(db, description, "description")),
    ...(await mediaRefsInHtml(db, recap, "recap")),
  ]);
  invalidate(["events"]);
  if (!id) redirect(`/admin/events/${eventId}`);
  return { status: "success", message: "Event saved." };
}

export async function toggleEventPublished(id: string) {
  await requireAdminAction();
  const db = getDb();
  const [e] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, id));
  if (!e) return;
  await db
    .update(schema.events)
    .set({ published: !e.published, updatedAt: new Date() })
    .where(eq(schema.events.id, id));
  invalidate(["events"]);
}

export async function deleteEvent(id: string) {
  await requireAdminAction();
  const db = getDb();
  await setMediaUsage(db, "event", id, []);
  await db.delete(schema.events).where(eq(schema.events.id, id));
  invalidate(["events"]);
  redirect("/admin/events");
}
