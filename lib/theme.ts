/**
 * Colour themes. Each theme gives a value to every colour variable the site uses (see :root in
 * app/globals.css, which holds the default "royal" theme so it never flashes). Text and background
 * pairs in every theme were checked for WCAG AA contrast (4.5:1 for small text).
 *
 * Roles: ink = the dark bands and footer; sand = the soft feature bands; bronze = buttons and
 * links (the action colour); label = small uppercase labels above headings.
 */
export type ThemeId = "royal" | "teal" | "classic";

type Vars = {
  ivory: string;
  "ivory-deep": string;
  "ivory-soft": string;
  sand: string;
  charcoal: string;
  ink: string;
  stone: string;
  bronze: string;
  "bronze-light": string;
  "bronze-text": string;
  "accent-hover": string;
  /** Border of outline buttons on light backgrounds (3:1 or better against every band). */
  outline: string;
  label: string;
  "label-text": string;
  "label-light": string;
  line: string;
  heading: string;
  copy: string;
  "copy-strong": string;
  "hero-a": string;
  "hero-b": string;
  "hero-c": string;
  "hero-d": string;
  tile: string;
};

export type Theme = {
  label: string;
  description: string;
  /** Swatches for the picker: light, band, dark, action, label. */
  swatches: [string, string, string, string, string];
  vars: Vars;
};

const ORANGE = {
  bronze: "#b34815",
  "bronze-light": "#f2a56e",
  "bronze-text": "#9a3d10",
  "accent-hover": "#9a3d12",
  outline: "#c75f26",
};

export const THEMES: Record<ThemeId, Theme> = {
  royal: {
    label: "Royal: deep purple, burnt orange, teal",
    description:
      "Deep purple for the dark bands and footer, burnt orange for buttons and links, soft teal bands and labels.",
    swatches: ["#f9f6f1", "#d6eae6", "#2b1245", "#b34815", "#0f766e"],
    vars: {
      ivory: "#f9f6f1",
      "ivory-deep": "#f1eaf0",
      "ivory-soft": "#fcfaf8",
      sand: "#d6eae6",
      charcoal: "#2a1f33",
      ink: "#2b1245",
      stone: "#635b6e",
      ...ORANGE,
      label: "#0f766e",
      "label-text": "#0b5f59",
      "label-light": "#6ccdc5",
      line: "#dcd2de",
      heading: "#1c0f2a",
      copy: "#4b4358",
      "copy-strong": "#33293d",
      "hero-a": "#dccfe6",
      "hero-b": "#e8dfec",
      "hero-c": "#f0eaf0",
      "hero-d": "#f6f1f2",
      tile: "#e2f0ee",
    },
  },
  teal: {
    label: "Teal-led: deep teal, burnt orange, purple",
    description:
      "Deep teal for the dark bands and footer, burnt orange for buttons and links, soft lavender bands and purple labels.",
    swatches: ["#f7f6f3", "#eadff1", "#0b3b40", "#b34815", "#5b2a86"],
    vars: {
      ivory: "#f7f6f3",
      "ivory-deep": "#e3f0ee",
      "ivory-soft": "#fafaf8",
      sand: "#eadff1",
      charcoal: "#1f2d33",
      ink: "#0b3b40",
      stone: "#58656b",
      ...ORANGE,
      label: "#5b2a86",
      "label-text": "#5b2a86",
      "label-light": "#cdb1f0",
      line: "#d3dedc",
      heading: "#0e1f24",
      copy: "#3f4d52",
      "copy-strong": "#28383d",
      "hero-a": "#cfe3e0",
      "hero-b": "#dcebe8",
      "hero-c": "#e8f1ef",
      "hero-d": "#f2f6f4",
      tile: "#eadff1",
    },
  },
  classic: {
    label: "Classic: ivory and bronze",
    description:
      "The original warm ivory, sand and bronze look from the first design.",
    swatches: ["#f7f4ee", "#e6dccd", "#1c1a18", "#8c6b3f", "#8c6b3f"],
    vars: {
      ivory: "#f7f4ee",
      "ivory-deep": "#efeae2",
      "ivory-soft": "#fbf8f6",
      sand: "#e6dccd",
      charcoal: "#252522",
      ink: "#1c1a18",
      stone: "#6b665e",
      bronze: "#8c6b3f",
      "bronze-light": "#b89a72",
      "bronze-text": "#7a5c33",
      "accent-hover": "#815f36",
      outline: "#b89a72",
      label: "#8c6b3f",
      "label-text": "#7a5c33",
      "label-light": "#b89a72",
      line: "#d9d0c3",
      heading: "#101010",
      copy: "#46433f",
      "copy-strong": "#2f2c29",
      "hero-a": "#d9ccbe",
      "hero-b": "#e6ddd3",
      "hero-c": "#ebe4dc",
      "hero-d": "#ece8e1",
      tile: "#ebe4d9",
    },
  },
};

export const DEFAULT_THEME: ThemeId = "royal";

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && v in THEMES;
}

/** CSS that switches the site to a theme (nothing is needed for the default). */
export function themeCss(id: ThemeId): string {
  const vars = THEMES[id].vars;
  return `:root{${Object.entries(vars)
    .map(([k, v]) => `--${k}:${v}`)
    .join(";")}}`;
}
