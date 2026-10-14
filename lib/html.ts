import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "blockquote",
    "strong",
    "em",
    "a",
    "br",
    "hr",
  ],
  allowedAttributes: { a: ["href", "rel", "target"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tag, attribs) => ({
      tagName: "a",
      attribs: {
        ...attribs,
        ...(attribs.href?.startsWith("http")
          ? { rel: "noopener noreferrer", target: "_blank" }
          : {}),
      },
    }),
  },
};

/** The one sanitizer for rich text: used by the seed, the future editor, and again at render time. */
export function sanitizeRich(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

/** Plain text of some HTML (for reading time, descriptions). */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

export function readingMinutes(html: string): number {
  const words = htmlToText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
