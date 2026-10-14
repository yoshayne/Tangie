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
};

export type ButtonRef = {
  label: string;
  href: string;
  variant?: "filled" | "outline";
  newTab?: boolean;
};

export type Background = "ivory" | "ivory-deep" | "sand" | "white" | "ink";
export type Spacing = "compact" | "normal" | "spacious";

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
