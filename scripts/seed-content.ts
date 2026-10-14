/**
 * Reads the verbatim copy out of SITE_CONTENT.md so the seed never retypes (or invents) content.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const SOURCE = readFileSync(
  path.resolve(process.cwd(), "SITE_CONTENT.md"),
  "utf8",
);

const ALLOWED = {
  allowedTags: [
    "p",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "strong",
    "em",
    "a",
    "br",
  ],
  allowedAttributes: { a: ["href", "rel", "target"] },
};

/** Markdown to sanitized HTML (the same sanitizer the admin editor will use on save). */
export function mdToHtml(md: string): string {
  return sanitizeHtml(marked.parse(md, { async: false }) as string, ALLOWED);
}

/** Lines of a "> quoted" block that follows `marker`, with the "> " removed. */
function quoteAfter(marker: string): string {
  const start = SOURCE.indexOf(marker);
  if (start < 0)
    throw new Error(`SITE_CONTENT.md: marker not found: ${marker}`);
  const lines = SOURCE.slice(start + marker.length).split("\n");
  const out: string[] = [];
  let started = false;
  for (const line of lines) {
    if (line.startsWith(">")) {
      started = true;
      out.push(line.replace(/^>\s?/, ""));
    } else if (started && line.trim() === "") {
      // blank line inside a quote is written as ">" so a truly blank line ends the block
      break;
    } else if (started) {
      break;
    }
  }
  return out.join("\n").trim();
}

function bulletsBetween(startMarker: string, endMarker: string): string[] {
  const a = SOURCE.indexOf(startMarker);
  const b = SOURCE.indexOf(endMarker, a);
  return SOURCE.slice(a + startMarker.length, b)
    .split("\n")
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

export const quickFacts = bulletsBetween(
  "## About / Quick Facts",
  "Welcome text:",
);

export const speakingTopics = (() => {
  const a = SOURCE.indexOf("**Speaking topics (seed `speaking_topics`):**");
  const b = SOURCE.indexOf("Closing line:", a);
  return SOURCE.slice(a, b)
    .split("\n")
    .map((l) => l.match(/^\d+\.\s+(.*)$/)?.[1]?.trim())
    .filter((x): x is string => Boolean(x));
})();

export const justifiedLiesSynopsisHtml = mdToHtml(quoteAfter("**Synopsis:**"));

export const launchRecapHtml = mdToHtml(
  quoteAfter(
    "**Book launch recap (use as recap_html on the March 14, 2026 event):**",
  ),
);

export type PostSeed = {
  slug: string;
  title: string;
  publishedAt: Date;
  category: string;
  legacyWixSlug: string;
  excerpt: string;
  coverSlot: string;
  bodyHtml: string;
};

const SIGNATURE =
  "*Written by Tangie Brickhouse Beaty · Tangie Beaty Writes · Copyright 2025 (c) All Rights Reserved*";

function postBody(title: string): string {
  const marker = `### Post body — ${title}`;
  const start = SOURCE.indexOf(marker);
  if (start < 0)
    throw new Error(`SITE_CONTENT.md: post body not found: ${title}`);
  const rest = SOURCE.slice(start + marker.length);
  const end = rest.search(/\n### Post body — |\n---\n/);
  const body = (end < 0 ? rest : rest.slice(0, end))
    .split("\n")
    // Editorial notes in SITE_CONTENT.md ("**[EDIT]** ...") are not part of the post.
    .filter((l) => !l.startsWith("**[EDIT]**"))
    .join("\n")
    .trim();
  return mdToHtml(`${body}\n\n${SIGNATURE}`);
}

function excerpt(prefix: string): string {
  const m = SOURCE.match(new RegExp(`- ${prefix}: (.*)`));
  if (!m) throw new Error(`SITE_CONTENT.md: excerpt not found: ${prefix}`);
  return m[1].trim();
}

// Same publish date for all three on the old site; staggered by minutes so ordering is stable.
// Newest first: Closed Doors, The Real Battle, Your Time.
export const posts: PostSeed[] = [
  {
    slug: "praise-god-for-closed-doors",
    title: "Praise God for Closed Doors: Your Only Way is Forward!",
    publishedAt: new Date("2025-12-14T17:03:00Z"),
    category: "Faith & Leadership",
    legacyWixSlug:
      "blog-3-praise-god-for-closed-doors-your-only-way-is-forward",
    excerpt: excerpt("Closed Doors"),
    coverSlot: "post.praise-god-for-closed-doors.cover",
    bodyHtml: postBody(
      "Praise God for Closed Doors: Your Only Way is Forward!",
    ),
  },
  {
    slug: "the-real-battle",
    title: "The Real Battle: Aligning What You See with What You Do",
    publishedAt: new Date("2025-12-14T17:02:00Z"),
    category: "Life Lessons",
    legacyWixSlug:
      "blog-2-the-real-battle-aligning-what-you-see-with-what-you-do",
    excerpt: excerpt("The Real Battle"),
    coverSlot: "post.the-real-battle.cover",
    bodyHtml: postBody(
      "The Real Battle: Aligning What You See with What You Do",
    ),
  },
  {
    slug: "your-time-your-truth",
    title: "Your Time, Your Truth: Why You Must Guard Your Divine Assignment",
    publishedAt: new Date("2025-12-14T17:01:00Z"),
    category: "Faith & Leadership",
    legacyWixSlug:
      "blog-1-your-time-your-truth-why-you-must-guard-your-divine-assignment",
    excerpt: excerpt("Your Time, Your Truth"),
    coverSlot: "post.your-time-your-truth.cover",
    bodyHtml: postBody(
      "Your Time, Your Truth: Why You Must Guard Your Divine Assignment",
    ),
  },
];

export const journalCategories = [
  "Faith & Leadership",
  "Behind the Scenes",
  "Creative Business",
  "Life Lessons",
  "Writing & Storytelling",
];

/** Eastern time, daylight saving (EDT, UTC-4), which applies to both March 2026 event dates. */
function edt(y: number, m: number, d: number, h: number, min = 0) {
  return new Date(Date.UTC(y, m - 1, d, h + 4, min));
}

export const events = [
  {
    slug: "justified-lies-book-launch-celebration",
    title: "Justified Lies Book Launch Celebration",
    startsAt: edt(2026, 3, 14, 11),
    endsAt: edt(2026, 3, 14, 14),
    venueName: "Books-A-Million",
    address: "164 Forum Dr, Columbia, SC 29229",
    city: "Columbia",
    state: "SC",
    descriptionHtml:
      "<p>Join me as I release my first novel Justified Lies!</p>",
    recapHtml: launchRecapHtml,
    imageSlot: "event.justified-lies-book-launch-celebration.image",
  },
  {
    slug: "book-release-celebration",
    title: "Book Release Celebration",
    startsAt: edt(2026, 3, 15, 14),
    endsAt: edt(2026, 3, 15, 17),
    venueName: "Kiki's Chicken and Waffles",
    address: "1260 Bower Pkwy A8, Columbia, SC 29212",
    city: "Columbia",
    state: "SC",
    descriptionHtml:
      "<p>Justified Lies — Official Book Signing. Be among the first to experience Justified Lies, the powerful debut novel by author, playwright, and producer Tangie Brickhouse Beaty. Join us for the official book launch and signing, the first stop on the Justified Lies national book tour.</p>",
    recapHtml: null,
    imageSlot: "event.book-release-celebration.image",
  },
];
