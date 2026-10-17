import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// Admin accounts. Unused until the admin milestone (M6); the site is public until then.
export const admins = pgTable("admins", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Media: every image/video/document lives in the Railway bucket and is tracked here.
// ---------------------------------------------------------------------------
export const media = pgTable(
  "media",
  {
    id: id(),
    kind: text("kind", { enum: ["image", "video", "document"] }).notNull(),
    key: text("key").notNull().unique(), // bucket key of the served file
    url: text("url").notNull(), // /media/<key>
    originalKey: text("original_key"),
    originalFilename: text("original_filename"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    caption: text("caption"),
    focalX: real("focal_x").notNull().default(0.5),
    focalY: real("focal_y").notNull().default(0.5),
    blurDataUrl: text("blur_data_url"),
    sha256: text("sha256"),
    source: text("source", { enum: ["upload", "wix_migration", "mockup"] })
      .notNull()
      .default("upload"),
    // The old Wix URL, kept for audit only. Never rendered.
    legacyUrl: text("legacy_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("media_sha256_idx").on(t.sha256),
    index("media_legacy_url_idx").on(t.legacyUrl),
  ],
);

export const mediaUsage = pgTable(
  "media_usage",
  {
    id: id(),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    entityType: text("entity_type", {
      enum: [
        "section",
        "book",
        "event",
        "post",
        "credit",
        "testimonial",
        "settings",
        "page",
      ],
    }).notNull(),
    entityId: text("entity_id").notNull(),
    fieldPath: text("field_path").notNull(),
  },
  (t) => [index("media_usage_media_idx").on(t.mediaId)],
);

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
export const books = pgTable("books", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  tagline: text("tagline"),
  seriesName: text("series_name"),
  seriesOrder: integer("series_order"),
  status: text("status", { enum: ["available", "coming_soon"] })
    .notNull()
    .default("available"),
  shortBlurb: text("short_blurb"),
  synopsisHtml: text("synopsis_html"),
  coverMediaId: uuid("cover_media_id").references(() => media.id),
  lifestyleMediaId: uuid("lifestyle_media_id").references(() => media.id),
  published: boolean("published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const bookLinks = pgTable("book_links", {
  id: id(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const events = pgTable(
  "events",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    timezone: text("timezone").notNull().default("America/New_York"),
    venueName: text("venue_name"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    isVirtual: boolean("is_virtual").notNull().default(false),
    descriptionHtml: text("description_html"),
    imageMediaId: uuid("image_media_id").references(() => media.id),
    galleryMediaIds: uuid("gallery_media_ids").array(),
    registrationUrl: text("registration_url"),
    recapHtml: text("recap_html"),
    published: boolean("published").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("events_starts_at_idx").on(t.startsAt)],
);

export const posts = pgTable(
  "posts",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    bodyHtml: text("body_html").notNull().default(""),
    coverMediaId: uuid("cover_media_id").references(() => media.id),
    category: text("category"),
    authorName: text("author_name")
      .notNull()
      .default("Tangie Brickhouse-Beaty"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    legacyWixSlug: text("legacy_wix_slug"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("posts_published_at_idx").on(t.publishedAt)],
);

export const credits = pgTable("credits", {
  id: id(),
  title: text("title").notNull(),
  category: text("category", {
    enum: ["stage", "film", "tv", "other"],
  })
    .notNull()
    .default("other"),
  roles: text("roles").array().notNull().default([]),
  year: integer("year"),
  description: text("description"),
  imageMediaId: uuid("image_media_id").references(() => media.id),
  watchLinks: jsonb("watch_links")
    .$type<Array<{ label: string; url: string }>>()
    .notNull()
    .default([]),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const testimonials = pgTable("testimonials", {
  id: id(),
  quote: text("quote").notNull(),
  name: text("name").notNull(),
  org: text("org"),
  portraitMediaId: uuid("portrait_media_id").references(() => media.id),
  context: text("context", { enum: ["speaking", "book"] })
    .notNull()
    .default("speaking"),
  approved: boolean("approved").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const speakingTopics = pgTable("speaking_topics", {
  id: id(),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const inquiries = pgTable("inquiries", {
  id: id(),
  type: text("type").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  organization: text("organization"),
  eventDate: text("event_date"),
  eventLocation: text("event_location"),
  audience: text("audience"),
  attendance: text("attendance"),
  budget: text("budget"),
  message: text("message").notNull(),
  status: text("status", { enum: ["new", "read", "archived"] })
    .notNull()
    .default("new"),
  createdAt: createdAt(),
});

export const subscribers = pgTable("subscribers", {
  id: id(),
  email: text("email").notNull().unique(),
  source: text("source"),
  brevoSynced: boolean("brevo_synced").notNull().default(false),
  createdAt: createdAt(),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

// ---------------------------------------------------------------------------
// Page builder
// ---------------------------------------------------------------------------
export const pages = pgTable("pages", {
  id: id(),
  slug: text("slug").notNull().unique(), // "" is the homepage
  title: text("title").notNull(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ogMediaId: uuid("og_media_id").references(() => media.id),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  isSystem: boolean("is_system").notNull().default(false),
  template: text("template", {
    enum: ["standard", "book_detail", "event_detail", "post_detail"],
  })
    .notNull()
    .default("standard"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  // The whole unpublished version of the page (section stack + settings), or null when there is
  // nothing waiting to be published. The live site never reads it.
  draft: jsonb("draft").$type<Record<string, unknown> | null>(),
});

export const sections = pgTable(
  "sections",
  {
    id: id(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    props: jsonb("props").$type<Record<string, unknown>>().notNull(),
    draftProps: jsonb("draft_props").$type<Record<string, unknown>>(),
    sortOrder: integer("sort_order").notNull().default(0),
    hidden: boolean("hidden").notNull().default(false),
    anchorId: text("anchor_id"),
    isDraftNew: boolean("is_draft_new").notNull().default(false),
    isDraftDeleted: boolean("is_draft_deleted").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sections_page_idx").on(t.pageId, t.sortOrder)],
);

export const pageRevisions = pgTable("page_revisions", {
  id: id(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").notNull(),
  note: text("note"),
  publishedBy: uuid("published_by").references(() => admins.id),
  createdAt: createdAt(),
});

export const sectionTemplates = pgTable("section_templates", {
  id: id(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  props: jsonb("props").$type<Record<string, unknown>>().notNull(),
  createdAt: createdAt(),
});

export const navItems = pgTable("nav_items", {
  id: id(),
  location: text("location", { enum: ["header", "footer"] }).notNull(),
  label: text("label").notNull(),
  href: text("href").notNull(),
  pageId: uuid("page_id").references(() => pages.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  isButton: boolean("is_button").notNull().default(false),
});

export const redirects = pgTable(
  "redirects",
  {
    id: id(),
    fromPath: text("from_path").notNull(),
    toPath: text("to_path").notNull(),
    statusCode: integer("status_code").notNull().default(301),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("redirects_from_path_idx").on(t.fromPath)],
);
