import type { Metadata } from "next";
import { htmlToText } from "@/lib/html";

export const SITE_NAME = "Tangie Brickhouse-Beaty";
export const DEFAULT_DESCRIPTION =
  "Author, playwright, director, and producer whose work spans books, stage, and screen.";

export type ShareImage = {
  mediaId: string;
  /** Changes whenever the file changes, so social sites fetch the new picture. */
  version?: string;
  alt?: string;
  /** "contain" puts the whole picture on a sand background (good for book covers). */
  fit?: "cover" | "contain";
};

/** Address of the 1200×630 JPEG made from a photo (see app/og/[id]/route.ts). */
export function shareImageUrl(img: ShareImage): string {
  const q = new URLSearchParams();
  if (img.version) q.set("v", img.version);
  if (img.fit === "contain") q.set("fit", "contain");
  const s = q.toString();
  return `/og/${img.mediaId}${s ? `?${s}` : ""}`;
}

/** A version label taken from a photo's address (it contains a new uuid whenever the file is replaced). */
export function versionOf(src: string | undefined): string | undefined {
  const name = src?.split("/").pop();
  return name ? name.slice(0, 13) : undefined;
}

/** Plain text of a description: no markup, no *italic* marks, cut at a word near 155 characters. */
export function tidyDescription(raw: string | null | undefined, max = 155) {
  if (!raw) return undefined;
  const text = htmlToText(raw).replace(/\*/g, "").replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 80)).replace(/[,;:.\s]+$/, "")}…`;
}

/** The first readable paragraph of a page, used when nobody wrote a search description. */
export function describeSections(
  sections: Array<{
    type: string;
    props: Record<string, unknown>;
    hidden?: boolean;
  }>,
): string | undefined {
  for (const s of sections) {
    if (s.hidden) continue;
    for (const key of ["intro", "body", "quote"]) {
      const v = s.props[key];
      if (typeof v === "string") {
        const d = tidyDescription(v);
        if (d && d.length > 40) return d;
      }
    }
  }
  return undefined;
}

/**
 * Titles, description, canonical address, and the Open Graph / Twitter cards for one page.
 * `absoluteTitle` skips the "| Tangie Brickhouse-Beaty" ending (used by the home page).
 */
export function pageMetadata(o: {
  title: string;
  absoluteTitle?: boolean;
  description?: string;
  path: string;
  image?: ShareImage | null;
  type?: "website" | "article" | "book";
  publishedTime?: string;
  noindex?: boolean;
}): Metadata {
  const full = o.absoluteTitle ? o.title : `${o.title} | ${SITE_NAME}`;
  const description = o.description ?? DEFAULT_DESCRIPTION;
  const images = o.image
    ? [
        {
          url: shareImageUrl(o.image),
          width: 1200,
          height: 630,
          alt: o.image.alt || o.title,
        },
      ]
    : undefined;
  return {
    title: { absolute: full },
    description,
    alternates: { canonical: o.path },
    robots: o.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type:
        o.type === "book"
          ? "book"
          : o.type === "article"
            ? "article"
            : "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: full,
      description,
      url: o.path,
      images,
      ...(o.type === "article" && o.publishedTime
        ? { publishedTime: o.publishedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: full,
      description,
      images: images?.map((i) => i.url),
    },
  };
}
