import type { CSSProperties } from "react";

/** A hand-made crop: which point of the photo stays in place, and how far it is zoomed in. */
export type ImageCrop = { x: number; y: number; zoom: number };

export type ImageRef = {
  /** Id of the row in `media`. The page builder uses it to track where each photo is used. */
  mediaId?: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  /** focal point, 0-1, x then y. Becomes object-position. */
  focal?: [number, number];
  /** Tiny blurred preview shown while the image loads. */
  blur?: string;
  /** Position and zoom chosen for this use of the photo in the page builder. Wins over `focal`. */
  crop?: ImageCrop;
};

export type ButtonRef = {
  label: string;
  href: string;
  variant?: "filled" | "outline";
  newTab?: boolean;
  /** Analytics event to fire on click (e.g. "book_purchase_click"). */
  track?: string;
};

export type Background = "ivory" | "ivory-deep" | "sand" | "white" | "ink";
export type Spacing = "compact" | "normal" | "spacious";

/**
 * Inline style that places a photo inside its frame. The frame must hide overflow. Zooming scales
 * around the chosen point, so that point stays where it is while the photo grows past the edges;
 * the page builder's adjust tool draws the very same thing.
 */
export function imageStyle(
  image: ImageRef,
  fallbackFocal: [number, number] = [0.5, 0.5],
): CSSProperties {
  const c = image.crop;
  const [x, y] = c ? [c.x, c.y] : (image.focal ?? fallbackFocal);
  const pos = `${Math.round(x * 1000) / 10}% ${Math.round(y * 1000) / 10}%`;
  const style: CSSProperties = { objectPosition: pos };
  if (c && c.zoom > 1.001) {
    style.transform = `scale(${Math.round(c.zoom * 1000) / 1000})`;
    style.transformOrigin = pos;
  }
  return style;
}

export function focalToPosition(focal?: [number, number]): string {
  const [x, y] = focal ?? [0.5, 0.5];
  return `${Math.round(x * 100)}% ${Math.round(y * 100)}%`;
}

/** Extra props for next/image so every section gets the blur-up placeholder when one exists. */
export function blurProps(image: ImageRef) {
  return image.blur
    ? ({ placeholder: "blur", blurDataURL: image.blur } as const)
    : ({ placeholder: "empty" } as const);
}
