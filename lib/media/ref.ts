import type { ImageRef } from "@/lib/sections/types";
import type { schema } from "@/lib/db";

type MediaRow = typeof schema.media.$inferSelect;

/** The shape stored inside section props: the media id plus a cached copy of what the page needs. */
export function toImageRef(
  m: MediaRow,
  overrides?: { alt?: string; focal?: [number, number] },
): ImageRef {
  return {
    mediaId: m.id,
    src: m.url,
    alt: overrides?.alt ?? m.alt,
    width: m.width ?? 0,
    height: m.height ?? 0,
    focal: overrides?.focal ?? [m.focalX, m.focalY],
    blur: m.blurDataUrl ?? undefined,
  };
}
