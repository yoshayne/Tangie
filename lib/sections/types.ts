export type ImageRef = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** focal point, 0-1, x then y. Becomes object-position. */
  focal?: [number, number];
};

export type ButtonRef = {
  label: string;
  href: string;
  variant?: "filled" | "outline";
  newTab?: boolean;
};

export type Background = "ivory" | "ivory-deep" | "sand" | "white" | "ink";

export function focalToPosition(focal?: [number, number]): string {
  const [x, y] = focal ?? [0.5, 0.5];
  return `${Math.round(x * 100)}% ${Math.round(y * 100)}%`;
}
