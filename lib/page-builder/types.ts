/** The unpublished (or live) version of a page, as the editor and the preview see it. */
export type DraftSection = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  anchorId: string | null;
  hidden: boolean;
};

export type DraftSettings = {
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  ogMedia: { id: string; url: string; alt: string } | null;
  showInMenu: boolean;
};

export type DraftDoc = {
  sections: DraftSection[];
  settings: DraftSettings;
};

export type Issue = {
  level: "error" | "warning";
  /** Section the problem is in, or null for page-level problems. */
  sectionId: string | null;
  message: string;
};

export const RESERVED_SLUGS = [
  "admin",
  "api",
  "books",
  "events",
  "journal",
  "preview",
  "media",
  "health",
  "login",
  "sitemap",
  "robots",
  "not-found-page",
  "newsletter-confirmed",
  "privacy",
  "terms",
  "press",
  "contact",
  "about",
  "speaking",
  "film-theater",
];

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
