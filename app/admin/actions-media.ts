"use server";

import { eq } from "drizzle-orm";
import { requireAdminAction } from "@/lib/admin/auth";
import { invalidate, tagsForMedia } from "@/lib/admin/invalidate";
import { getDb, schema } from "@/lib/db";
import { deleteMediaItem, getUsage, type UsageItem } from "@/lib/media/manage";
import { refreshReferences } from "@/lib/media/manage";

export type MediaDetail = {
  id: string;
  kind: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string;
  focalX: number;
  focalY: number;
  originalFilename: string | null;
  usage: UsageItem[];
};

export async function loadMediaDetail(id: string): Promise<MediaDetail | null> {
  await requireAdminAction();
  const [m] = await getDb()
    .select()
    .from(schema.media)
    .where(eq(schema.media.id, id))
    .limit(1);
  if (!m) return null;
  return {
    id: m.id,
    kind: m.kind,
    url: m.url,
    mimeType: m.mimeType,
    sizeBytes: m.sizeBytes,
    width: m.width,
    height: m.height,
    alt: m.alt,
    caption: m.caption ?? "",
    focalX: m.focalX,
    focalY: m.focalY,
    originalFilename: m.originalFilename,
    usage: await getUsage(id),
  };
}

export async function saveMediaMeta(
  id: string,
  input: { alt: string; caption: string; focalX: number; focalY: number },
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAction();
  const alt = input.alt.trim().slice(0, 300);
  const clamp = (n: number) =>
    Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0.5));
  const [row] = await getDb()
    .update(schema.media)
    .set({
      alt,
      caption: input.caption.trim().slice(0, 300) || null,
      focalX: clamp(input.focalX),
      focalY: clamp(input.focalY),
      updatedAt: new Date(),
    })
    .where(eq(schema.media.id, id))
    .returning();
  if (!row) return { ok: false, error: "That file no longer exists." };
  // Section props keep a cached copy of the focal point; entities read it live.
  await refreshReferences(row);
  invalidate(await tagsForMedia(id));
  return { ok: true };
}

export async function deleteMedia(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAction();
  const res = await deleteMediaItem(id);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
