/**
 * Seeds the database and bucket from SITE_CONTENT.md and seed-assets/.
 * Run: npm run seed
 *
 * Safe to run on every deploy: it only creates what is missing and never overwrites anything
 * that already exists, so later edits made in the admin are never lost. Photos are matched by
 * file hash, so nothing is uploaded twice.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { saveImage, type MediaRow } from "@/lib/media/save-image";
import { toImageRef } from "@/lib/media/ref";
import { findMediaRefs, setMediaUsage } from "@/lib/media/usage";
import { storageDriverName } from "@/lib/storage";
import {
  AFFILIATES,
  FOOTER_NAV,
  HEADER_NAV,
  SOCIAL_LINKS,
} from "@/lib/site-data";
import * as content from "./seed-content";
import { buildInnerPages, type PageSeed } from "./seed-pages";

type ManifestEntry = {
  slot: string | null;
  file: string | null;
  fallback: string;
  alt: string;
  focal: [number, number];
  legacy_url: string;
  note?: string;
};

const ROOT = process.cwd();
const db = getDb();

// One photo can fill several slots, each with its own alt text and crop point.
const slotInfo = new Map<string, { alt: string; focal: [number, number] }>();
const refFor = (slot: string, m: MediaRow) => toImageRef(m, slotInfo.get(slot));

async function seedMedia(): Promise<Map<string, MediaRow>> {
  const manifest = JSON.parse(
    readFileSync(path.join(ROOT, "seed-assets/manifest.json"), "utf8"),
  ) as {
    images: ManifestEntry[];
    missing: string[];
  };
  const bySlot = new Map<string, MediaRow>();

  for (const entry of manifest.images) {
    if (!entry.slot) continue;
    // Priority: the mockup's original file, then the migrated Wix file.
    const mockupFile =
      entry.file && existsSync(path.join(ROOT, "seed-assets", entry.file))
        ? entry.file
        : null;
    const file = mockupFile ?? entry.fallback;
    const abs = path.join(ROOT, "seed-assets", file);
    if (!existsSync(abs)) {
      console.warn(`TODO(client): missing image for ${entry.slot}`);
      continue;
    }
    const row = await saveImage({
      buffer: readFileSync(abs),
      filename: path.basename(file),
      alt: entry.alt,
      focal: entry.focal,
      source: mockupFile ? "mockup" : "wix_migration",
      // Old Wix URL kept only for audit (media.legacy_url); it is never rendered.
      legacyUrl: mockupFile ? undefined : entry.legacy_url,
    });
    bySlot.set(entry.slot, row);
    slotInfo.set(entry.slot, { alt: entry.alt, focal: entry.focal });
    console.log(`media  ${entry.slot}  ->  ${row.key}`);
  }
  manifest.missing.forEach((m) => console.warn(m));
  return bySlot;
}

async function seedBooks(media: Map<string, MediaRow>) {
  const cover = media.get("book.justified-lies.cover");
  const [book] = await db
    .insert(schema.books)
    .values({
      slug: "justified-lies",
      title: "Justified Lies",
      tagline: "The Lie That Started It All!",
      seriesName: "The Cost of Truth Series",
      seriesOrder: 1,
      status: "available",
      shortBlurb:
        "*Justified Lies* is a compelling novel that explores the complexities of relationships, faith, and the choices that shape our lives.",
      synopsisHtml: content.justifiedLiesSynopsisHtml,
      coverMediaId: cover?.id,
      published: true,
      sortOrder: 1,
    })
    .onConflictDoNothing()
    .returning();
  if (book && cover) {
    await setMediaUsage(db, "book", book.id, [
      { mediaId: cover.id, fieldPath: "coverMediaId" },
    ]);
  }
  // TODO(client): confirm the spelling (the old site says "Divided Loyalities") and details. Unpublished until then.
  await db
    .insert(schema.books)
    .values({
      slug: "divided-loyalties",
      title: "Divided Loyalties",
      seriesName: "The Cost of Truth Series",
      seriesOrder: 2,
      status: "coming_soon",
      published: false,
      sortOrder: 2,
    })
    .onConflictDoNothing();
  // TODO(client): purchase links (Stripe Payment Link or retailers). None are added for now.
}

async function seedEvents(media: Map<string, MediaRow>) {
  for (const e of content.events) {
    const img = media.get(e.imageSlot);
    const [row] = await db
      .insert(schema.events)
      .values({
        slug: e.slug,
        title: e.title,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        venueName: e.venueName,
        address: e.address,
        city: e.city,
        state: e.state,
        descriptionHtml: e.descriptionHtml,
        recapHtml: e.recapHtml,
        imageMediaId: img?.id,
        published: true,
      })
      .onConflictDoNothing()
      .returning();
    if (row && img)
      await setMediaUsage(db, "event", row.id, [
        { mediaId: img.id, fieldPath: "imageMediaId" },
      ]);
  }
}

async function seedPosts(media: Map<string, MediaRow>) {
  for (const p of content.posts) {
    const cover = media.get(p.coverSlot);
    const [row] = await db
      .insert(schema.posts)
      .values({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        bodyHtml: p.bodyHtml,
        category: p.category,
        authorName: "Tangie Brickhouse-Beaty",
        publishedAt: p.publishedAt,
        status: "published",
        legacyWixSlug: p.legacyWixSlug,
        coverMediaId: cover?.id,
      })
      .onConflictDoNothing()
      .returning();
    if (row && cover)
      await setMediaUsage(db, "post", row.id, [
        { mediaId: cover.id, fieldPath: "coverMediaId" },
      ]);
  }
}

async function seedSpeakingTopics() {
  const [{ n }] = await db.select({ n: count() }).from(schema.speakingTopics);
  if (n > 0) return;
  await db
    .insert(schema.speakingTopics)
    .values(
      content.speakingTopics.map((title, i) => ({ title, sortOrder: i + 1 })),
    );
}

async function seedSettings() {
  const settings: Record<string, unknown> = {
    wordmark: { line1: "Tangie", line2: "Brickhouse-Beaty" },
    brand_tagline:
      "Stories that Heal. Truth that Confronts. Faith that Endures.",
    // TODO(client): approve phone and email for public display. Not shown anywhere until approved.
    contact: {
      phone: "803.545.4256",
      email: "tangiebeaty@gmail.com",
      showPublicly: false,
    },
    // TODO(client): YouTube URL (hidden until supplied). X is kept out of the footer, as in the mockup.
    social: SOCIAL_LINKS,
    affiliates: AFFILIATES,
    quick_facts: content.quickFacts,
    journal_categories: content.journalCategories,
  };
  for (const [key, value] of Object.entries(settings)) {
    await db
      .insert(schema.siteSettings)
      .values({ key, value })
      .onConflictDoNothing();
  }
}

async function seedNav() {
  const [{ n }] = await db.select({ n: count() }).from(schema.navItems);
  if (n > 0) return;
  await db.insert(schema.navItems).values([
    ...HEADER_NAV.map((item, i) => ({
      location: "header" as const,
      label: item.label,
      href: item.href,
      sortOrder: i + 1,
    })),
    {
      location: "header" as const,
      label: "Contact",
      href: "/contact",
      sortOrder: 99,
      isButton: true,
    },
    ...FOOTER_NAV.map((item, i) => ({
      location: "footer" as const,
      label: item.label,
      href: item.href,
      sortOrder: i + 1,
    })),
  ]);
}

async function seedHome(media: Map<string, MediaRow>) {
  const [existing] = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.slug, ""))
    .limit(1);
  if (existing) {
    console.log("home page already exists, leaving it untouched");
    return;
  }
  const img = (slot: string) => {
    const m = media.get(slot);
    if (!m) throw new Error(`Missing media for ${slot}`);
    return refFor(slot, m);
  };
  const optImg = (slot: string) => (media.get(slot) ? img(slot) : undefined);

  const [page] = await db
    .insert(schema.pages)
    .values({
      slug: "",
      title: "Home",
      seoDescription:
        "Tangie Brickhouse-Beaty is an author, playwright, director, and producer whose work spans books, stage, and screen.",
      status: "published",
      isSystem: true,
      publishedAt: new Date(),
    })
    .returning();

  const stack: Array<{
    type: string;
    props: Record<string, unknown>;
    anchorId?: string;
  }> = [
    {
      type: "hero_split",
      props: {
        titleLine1: "Tangie",
        titleLine2: "Brickhouse-Beaty",
        roleLine: "Author | Playwright | Director | Producer",
        body: "Tangie Brickhouse-Beaty is an author, playwright, director, and producer whose work spans books, stage, and screen.",
        buttons: [
          {
            label: "Explore the Book",
            href: "/books/justified-lies",
            variant: "filled",
          },
          {
            label: "Speaking & Bookings",
            href: "/speaking",
            variant: "outline",
          },
        ],
        image: img("home.hero.image"),
        imageSide: "right",
      },
    },
    {
      type: "feature_book",
      props: {
        eyebrow: "Featured Book",
        bookSlug: "justified-lies",
        headingItalic: true,
        image: img("home.featured-book.image"),
        // TODO(client): lifestyle photo of the book; "cover" fit once it is supplied.
        imageFit: "contain",
        imageSide: "left",
      },
    },
    {
      type: "image_text",
      props: {
        eyebrow: "Meet Tangie",
        heading: "Author. Playwright.\nDirector. Producer.",
        body: "Tangie Brickhouse-Beaty's work spans books, stage, and screen. She creates stories that explore the complexities of life, faith, relationships, and redemption.",
        buttons: [{ label: "About Tangie", href: "/about", variant: "filled" }],
        image: img("home.meet.image"),
        imageSide: "left",
        imageStyle: "framed",
      },
    },
    {
      type: "dark_feature",
      props: {
        eyebrow: "Film & Theater",
        heading: "Stories Beyond the Page",
        body: "From powerful stage productions to film, Tangie Brickhouse-Beaty brings compelling stories to life. Explore her writing, directing, producing, and casting work, including *Secrets in Plain Sight* and other notable productions.",
        buttons: [
          {
            label: "Explore Film & Theater",
            href: "/film-theater",
            variant: "filled",
          },
        ],
        image: optImg("home.film.image"),
      },
    },
    {
      type: "image_text",
      props: {
        eyebrow: "Speaking",
        heading: "Engage. Inspire. Connect.",
        body: "Tangie is available for author talks, book clubs, faith-based events, workshops, panels, and more. Bring her to your next event.",
        buttons: [
          {
            label: "Book Tangie",
            href: "/speaking#inquiry",
            variant: "filled",
          },
        ],
        image: img("home.speaking.image"),
        imageSide: "left",
        imageStyle: "bleed",
      },
    },
    {
      type: "event_cards",
      props: {
        eyebrow: "Upcoming Events",
        heading: "Where to See Tangie",
        linkLabel: "View all events",
        linkHref: "/events",
        count: 3,
        layout: "grid",
        emptyText:
          "New dates are on the way. Join the mailing list to hear first.",
        emptyLinkLabel: "Book Tangie for your event",
        emptyLinkHref: "/speaking#inquiry",
      },
    },
    {
      type: "post_cards",
      props: {
        eyebrow: "From the Journal",
        heading: "Latest Reflections",
        linkLabel: "View all posts",
        linkHref: "/journal",
        count: 3,
      },
    },
    {
      type: "newsletter",
      props: {
        eyebrow: "Stay Connected",
        heading: "Join the Mailing List",
        body: "Be the first to hear about new books, events, and updates.",
        buttonLabel: "Subscribe",
        successMessage: "Check your inbox to confirm.",
        image: optImg("home.newsletter.image"),
      },
    },
  ];

  for (const [i, s] of stack.entries()) {
    const [row] = await db
      .insert(schema.sections)
      .values({
        pageId: page.id,
        type: s.type,
        props: s.props,
        sortOrder: i + 1,
        anchorId: s.anchorId,
      })
      .returning();
    await setMediaUsage(db, "section", row.id, findMediaRefs(s.props));
  }
  console.log(`home page created with ${stack.length} sections`);
}

const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`;

async function createPageIfMissing(def: PageSeed & { isSystem?: boolean }) {
  const [existing] = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.slug, def.slug))
    .limit(1);
  if (existing) return false;
  const [page] = await db
    .insert(schema.pages)
    .values({
      slug: def.slug,
      title: def.title,
      seoDescription: def.seoDescription,
      template: def.template ?? "standard",
      status: "published",
      isSystem: true,
      publishedAt: new Date(),
    })
    .returning();
  for (const [i, sec] of def.stack.entries()) {
    const [row] = await db
      .insert(schema.sections)
      .values({
        pageId: page.id,
        type: sec.type,
        props: sec.props,
        sortOrder: i + 1,
        anchorId: sec.anchorId,
        hidden: sec.hidden ?? false,
      })
      .returning();
    await setMediaUsage(db, "section", row.id, findMediaRefs(sec.props));
  }
  console.log(`page /${def.slug} created with ${def.stack.length} sections`);
  return true;
}

async function seedInnerPages(media: Map<string, MediaRow>) {
  const img = (
    slot: string,
    over?: { alt?: string; focal?: [number, number] },
  ) => {
    const m = media.get(slot);
    if (!m) throw new Error(`Missing media for ${slot}`);
    const base = slotInfo.get(slot);
    return toImageRef(m, {
      alt: over?.alt ?? base?.alt,
      focal: over?.focal ?? base?.focal,
    });
  };
  const logo = media.get("press.logo-white");
  const cover = media.get("book.justified-lies.cover");
  const pages = buildInnerPages(img, {
    logoUrl: logo?.url,
    logoSize: logo ? kb(logo.sizeBytes) : undefined,
    coverUrl: cover?.url,
    coverSize: cover ? kb(cover.sizeBytes) : undefined,
  });
  for (const p of pages) await createPageIfMissing(p);
}

async function seedCredits() {
  const [{ n }] = await db.select({ n: count() }).from(schema.credits);
  if (n > 0) return;
  // TODO(client): the full credits list, roles, years and the Tubi / Peacock links.
  await db.insert(schema.credits).values({
    title: "Secrets in Plain Sight",
    category: "tv",
    description:
      "Hit TV series created with her team, streaming on Tubi and Peacock.",
    featured: true,
    sortOrder: 1,
  });
}

/** Creates the first admin from ADMIN_EMAIL + ADMIN_PASSWORD_HASH (never from a plain password). Existing admins are left alone. */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !passwordHash) {
    console.log(
      "admin: ADMIN_EMAIL / ADMIN_PASSWORD_HASH not set, no admin created (admin stays off)",
    );
    return;
  }
  const [created] = await db
    .insert(schema.admins)
    .values({ email, passwordHash })
    .onConflictDoNothing()
    .returning();
  console.log(
    created ? `admin: created ${email}` : `admin: ${email} already exists`,
  );
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  console.log(`Storage: ${storageDriverName()}`);
  const media = await seedMedia();
  await seedBooks(media);
  await seedEvents(media);
  await seedPosts(media);
  await seedSpeakingTopics();
  await seedSettings();
  await seedNav();
  await seedHome(media);
  await seedCredits();
  await seedInnerPages(media);
  await seedAdmin();
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
