import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { sanitizeRich } from "@/lib/html";
import { toImageRef } from "@/lib/media/ref";
import { findMediaRefs, setMediaUsage } from "@/lib/media/usage";
import { registry, isSectionType } from "@/lib/sections/registry";
import { SECTION_META, type FieldSpec } from "@/lib/sections/meta";
import {
  RESERVED_SLUGS,
  SLUG_PATTERN,
  type DraftDoc,
  type DraftSection,
  type Issue,
} from "./types";

type PageRow = typeof schema.pages.$inferSelect;

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------
export async function loadLiveDoc(page: PageRow): Promise<DraftDoc> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.sections)
    .where(eq(schema.sections.pageId, page.id))
    .orderBy(asc(schema.sections.sortOrder));
  const og = page.ogMediaId
    ? (
        await db
          .select()
          .from(schema.media)
          .where(eq(schema.media.id, page.ogMediaId))
      )[0]
    : null;
  const menu = await db
    .select({ id: schema.navItems.id })
    .from(schema.navItems)
    .where(
      and(
        eq(schema.navItems.pageId, page.id),
        eq(schema.navItems.location, "header"),
      ),
    )
    .limit(1);
  return {
    sections: rows.map((s) => ({
      id: s.id,
      type: s.type,
      props: s.props,
      anchorId: s.anchorId,
      hidden: s.hidden,
    })),
    settings: {
      title: page.title,
      slug: page.slug,
      seoTitle: page.seoTitle ?? "",
      seoDescription: page.seoDescription ?? "",
      ogMedia: og ? { id: og.id, url: og.url, alt: og.alt } : null,
      showInMenu: menu.length > 0,
    },
  };
}

/** The version the editor and preview work with: the draft if there is one, else the live page. */
export async function loadWorkingDoc(
  pageId: string,
): Promise<{ page: PageRow; doc: DraftDoc; hasDraft: boolean } | null> {
  const [page] = await getDb()
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.id, pageId))
    .limit(1);
  if (!page) return null;
  const draft = page.draft as DraftDoc | null;
  const doc =
    draft && Array.isArray(draft.sections) ? draft : await loadLiveDoc(page);
  return { page, doc: await hydrateDoc(doc), hasDraft: Boolean(draft) };
}

/** Refreshes the cached copy of every photo in the page (a replaced file or new alt text). */
export async function hydrateDoc(doc: DraftDoc): Promise<DraftDoc> {
  const ids = new Set<string>();
  for (const s of doc.sections)
    for (const r of findMediaRefs(s.props)) ids.add(r.mediaId);
  if (!ids.size) return doc;
  const rows = await getDb()
    .select()
    .from(schema.media)
    .where(inArray(schema.media.id, [...ids]));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.mediaId === "string" && typeof o.src === "string") {
        const m = byId.get(o.mediaId);
        return m ? toImageRef(m) : o;
      }
      return Object.fromEntries(
        Object.entries(o).map(([k, x]) => [k, walk(x)]),
      );
    }
    return v;
  };
  return {
    ...doc,
    sections: doc.sections.map((s) => ({
      ...s,
      props: walk(s.props) as Record<string, unknown>,
    })),
  };
}

// ---------------------------------------------------------------------------
// Cleaning: turns what the editor produced into what the schemas expect
// ---------------------------------------------------------------------------
const stripEmpty = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(stripEmpty);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([, x]) => x !== "" && x !== null && x !== undefined)
        .map(([k, x]) => [k, stripEmpty(x)]),
    );
  return v;
};

function schemaOf(type: string) {
  return (
    registry as Record<
      string,
      {
        schema: {
          safeParse: (v: unknown) => {
            success: boolean;
            error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
          };
        };
      }
    >
  )[type]?.schema;
}

/** Applies each section type's own rules: an empty field means "not set" where that matters. */
export function normalizeProps(
  type: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const sch = schemaOf(type);
  if (!sch) return props;
  let out: Record<string, unknown> = props;
  if (type === "feature_book") {
    out = { ...props };
    for (const k of ["heading", "body"]) if (out[k] === "") delete out[k];
    if (Array.isArray(out.buttons) && out.buttons.length === 0)
      delete out.buttons;
  }
  if (sch.safeParse(out).success) return out;
  const stripped = stripEmpty(out) as Record<string, unknown>;
  return sch.safeParse(stripped).success ? stripped : out;
}

function mapRich(
  fields: FieldSpec[],
  props: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...props };
  for (const f of fields) {
    const v = out[f.name];
    if (f.kind === "richtext" && typeof v === "string")
      out[f.name] = sanitizeRich(v);
    else if (f.kind === "group" && v && typeof v === "object")
      out[f.name] = mapRich(f.fields, v as Record<string, unknown>);
    else if (f.kind === "repeater" && Array.isArray(v))
      out[f.name] = v.map((item) =>
        item && typeof item === "object"
          ? mapRich(f.fields, item as Record<string, unknown>)
          : item,
      );
  }
  return out;
}

/** Sanitizes rich text and applies type rules. Used for preview, and again on publish. */
export function cleanSection(s: DraftSection): DraftSection {
  const meta = SECTION_META[s.type];
  const rich = meta ? mapRich(meta.fields, s.props) : s.props;
  return { ...s, props: normalizeProps(s.type, rich) };
}

// ---------------------------------------------------------------------------
// Checking
// ---------------------------------------------------------------------------
function collectImages(v: unknown, out: Array<Record<string, unknown>> = []) {
  if (Array.isArray(v)) v.forEach((x) => collectImages(x, out));
  else if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.src === "string" && "alt" in o && "width" in o) out.push(o);
    else Object.values(o).forEach((x) => collectImages(x, out));
  }
  return out;
}

function collectLinks(v: unknown, out: string[] = [], key = "") {
  if (Array.isArray(v)) v.forEach((x) => collectLinks(x, out, key));
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v as Record<string, unknown>))
      collectLinks(x, out, k);
  else if (typeof v === "string" && v && /href$/i.test(key)) out.push(v);
  return out;
}

/** Purely decorative backdrops: an empty description is correct for screen readers here. */
const DECORATIVE_IMAGES: Record<string, string[]> = {
  newsletter: ["image"],
  page_hero: ["image"],
};

const DYNAMIC_PREFIXES = ["/books/", "/events/", "/journal/", "/media/"];

export function checkLink(
  link: string,
  knownPaths: Set<string>,
): string | null {
  if (/^(https:\/\/|mailto:|tel:)/i.test(link)) return null;
  if (link.startsWith("/")) {
    const path = link.split(/[?#]/)[0] || "/";
    const clean = path.length > 1 ? path.replace(/\/$/, "") : path;
    if (
      knownPaths.has(clean) ||
      DYNAMIC_PREFIXES.some((p) => clean.startsWith(p))
    )
      return null;
    return `The link “${link}” goes to a page that does not exist.`;
  }
  return `The link “${link}” must start with https:// (or / for a page on this site).`;
}

export async function knownPaths(): Promise<Set<string>> {
  const rows = await getDb()
    .select({ slug: schema.pages.slug, status: schema.pages.status })
    .from(schema.pages);
  const set = new Set<string>(["/", "/books", "/events", "/journal"]);
  for (const r of rows) set.add(`/${r.slug}`);
  return set;
}

export async function validateSlug(
  page: { id?: string; slug: string; isSystem: boolean },
  slug: string,
): Promise<string | null> {
  if (page.isSystem)
    return slug === page.slug ? null : "This page's address cannot be changed.";
  if (!slug) return "Choose an address for the page.";
  if (!SLUG_PATTERN.test(slug))
    return "Use only lowercase letters, numbers and dashes in the address.";
  if (RESERVED_SLUGS.includes(slug))
    return `“${slug}” is reserved. Choose another address.`;
  const clash = await getDb()
    .select({ id: schema.pages.id })
    .from(schema.pages)
    .where(
      and(
        eq(schema.pages.slug, slug),
        page.id ? ne(schema.pages.id, page.id) : undefined,
      ),
    )
    .limit(1);
  return clash.length ? "Another page already uses this address." : null;
}

/** Everything that would stop (errors) or deserve a second look (warnings) before publishing. */
export async function validateDoc(
  page: PageRow,
  doc: DraftDoc,
): Promise<Issue[]> {
  const issues: Issue[] = [];
  const add = (
    level: Issue["level"],
    sectionId: string | null,
    message: string,
  ) => issues.push({ level, sectionId, message });

  if (!doc.settings.title.trim())
    add("error", null, "The page needs a title (Page settings).");
  const slugProblem = await validateSlug(page, doc.settings.slug);
  if (slugProblem) add("error", null, slugProblem);

  const known = await knownPaths();
  for (const raw of doc.sections) {
    const label = SECTION_META[raw.type]?.label ?? raw.type;
    if (!isSectionType(raw.type) || !SECTION_META[raw.type]) {
      add("error", raw.id, `${raw.type} is not a known section type.`);
      continue;
    }
    const s = cleanSection(raw);
    const sch = schemaOf(s.type);
    const parsed = sch?.safeParse(s.props);
    if (parsed && !parsed.success) {
      for (const i of parsed.error?.issues.slice(0, 3) ?? []) {
        const where = i.path.length ? ` (${i.path.join(" › ")})` : "";
        add("error", s.id, `${label}: ${i.message}${where}`);
      }
    }
    const described = Object.fromEntries(
      Object.entries(s.props).filter(
        ([k]) => !(DECORATIVE_IMAGES[s.type] ?? []).includes(k),
      ),
    );
    for (const img of collectImages(described))
      if (!String(img.alt ?? "").trim())
        add(
          "error",
          s.id,
          `${label}: a photo needs a description (alt text) before you can publish.`,
        );
    if (!s.hidden)
      for (const link of collectLinks(s.props)) {
        const problem = checkLink(link, known);
        if (problem) add("error", s.id, `${label}: ${problem}`);
      }
    if (s.anchorId && !/^[a-z][a-z0-9-]*$/.test(s.anchorId))
      add(
        "error",
        s.id,
        `${label}: the anchor name may only use lowercase letters, numbers and dashes.`,
      );
  }

  const visible = doc.sections.filter((s) => !s.hidden);
  if (
    !page.slug.startsWith("_template") &&
    !visible.some((s) => s.type === "hero_split" || s.type === "page_hero")
  )
    add(
      "warning",
      null,
      "This page has no title section (“Page title” or “Hero”), so it has no main heading. Add one for search engines and screen readers.",
    );
  const heroes = visible.filter(
    (s) => s.type === "hero_split" || s.type === "page_hero",
  );
  if (heroes.length > 1)
    add(
      "warning",
      null,
      "This page has more than one title section. Only the first should be the main heading.",
    );
  return issues;
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------
export type PublishResult = { tags: string[]; slug: string };

export async function publishDoc(
  page: PageRow,
  doc: DraftDoc,
  note: string,
  adminId: string | null,
): Promise<PublishResult> {
  const db = getDb();
  const cleaned = doc.sections.map(cleanSection);
  const oldSlug = page.slug;
  const newSlug = page.isSystem ? page.slug : doc.settings.slug;
  const tags = new Set<string>([`page:${oldSlug}`, `page:${newSlug}`]);
  const now = new Date();

  // The first time a page is published from the builder, keep the version that was live before,
  // so there is always something to go back to.
  const [{ n: revisionCount }] = await db
    .select({ n: count() })
    .from(schema.pageRevisions)
    .where(eq(schema.pageRevisions.pageId, page.id));
  const baseline =
    revisionCount === 0 && page.status === "published"
      ? await loadLiveDoc(page)
      : null;

  await db.transaction(async (tx) => {
    if (baseline)
      await tx.insert(schema.pageRevisions).values({
        pageId: page.id,
        snapshot: baseline as unknown as Record<string, unknown>,
        note: "Before the first change made in the page builder",
        publishedBy: null,
        createdAt: new Date(now.getTime() - 1000),
      });
    const existing = await tx
      .select({ id: schema.sections.id })
      .from(schema.sections)
      .where(eq(schema.sections.pageId, page.id));
    const existingIds = new Set(existing.map((e) => e.id));
    const keep = new Set(cleaned.map((s) => s.id));

    const gone = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
    if (gone.length)
      await tx.delete(schema.sections).where(inArray(schema.sections.id, gone));

    for (const [i, s] of cleaned.entries()) {
      const values = {
        type: s.type,
        props: s.props,
        draftProps: null,
        sortOrder: i + 1,
        hidden: s.hidden,
        anchorId: s.anchorId || null,
        isDraftNew: false,
        isDraftDeleted: false,
        updatedAt: now,
      };
      if (existingIds.has(s.id))
        await tx
          .update(schema.sections)
          .set(values)
          .where(eq(schema.sections.id, s.id));
      else
        await tx
          .insert(schema.sections)
          .values({ id: s.id, pageId: page.id, ...values });
    }

    await tx
      .update(schema.pages)
      .set({
        slug: newSlug,
        title: doc.settings.title.trim(),
        seoTitle: doc.settings.seoTitle.trim() || null,
        seoDescription: doc.settings.seoDescription.trim() || null,
        ogMediaId: doc.settings.ogMedia?.id ?? null,
        status: "published",
        publishedAt: page.publishedAt ?? now,
        draft: null,
        updatedAt: now,
      })
      .where(eq(schema.pages.id, page.id));

    if (newSlug !== oldSlug && page.status === "published") {
      await tx
        .insert(schema.redirects)
        .values({
          fromPath: `/${oldSlug}`,
          toPath: `/${newSlug}`,
          statusCode: 301,
        })
        .onConflictDoUpdate({
          target: schema.redirects.fromPath,
          set: { toPath: `/${newSlug}` },
        });
      // A page that moves back to an address that used to redirect should not redirect away.
      await tx
        .delete(schema.redirects)
        .where(eq(schema.redirects.fromPath, `/${newSlug}`));
    }

    // "Show in header menu"
    if (!newSlug.startsWith("_template")) {
      const items = await tx
        .select()
        .from(schema.navItems)
        .where(
          and(
            eq(schema.navItems.pageId, page.id),
            eq(schema.navItems.location, "header"),
          ),
        );
      if (doc.settings.showInMenu && items.length === 0) {
        const header = await tx
          .select()
          .from(schema.navItems)
          .where(
            and(
              eq(schema.navItems.location, "header"),
              eq(schema.navItems.isButton, false),
            ),
          );
        const next = header.reduce((m, h) => Math.max(m, h.sortOrder), 0) + 1;
        await tx.insert(schema.navItems).values({
          location: "header",
          label: doc.settings.title.trim().slice(0, 40),
          href: `/${newSlug}`,
          pageId: page.id,
          sortOrder: Math.min(next, 90),
          isButton: false,
        });
        tags.add("nav");
      } else if (doc.settings.showInMenu) {
        if (items.some((i) => i.href !== `/${newSlug}`)) {
          await tx
            .update(schema.navItems)
            .set({ href: `/${newSlug}` })
            .where(
              and(
                eq(schema.navItems.pageId, page.id),
                eq(schema.navItems.location, "header"),
              ),
            );
          tags.add("nav");
        }
      } else if (items.length) {
        await tx
          .delete(schema.navItems)
          .where(
            and(
              eq(schema.navItems.pageId, page.id),
              eq(schema.navItems.location, "header"),
            ),
          );
        tags.add("nav");
      }
      // Links in the footer follow a changed address too.
      if (newSlug !== oldSlug)
        await tx
          .update(schema.navItems)
          .set({ href: `/${newSlug}` })
          .where(
            and(
              eq(schema.navItems.pageId, page.id),
              eq(schema.navItems.location, "footer"),
            ),
          );
    }

    await tx.insert(schema.pageRevisions).values({
      pageId: page.id,
      snapshot: {
        sections: cleaned,
        settings: doc.settings,
      } as unknown as Record<string, unknown>,
      note: note.trim() || null,
      publishedBy: adminId,
    });
    const revs = await tx
      .select({ id: schema.pageRevisions.id })
      .from(schema.pageRevisions)
      .where(eq(schema.pageRevisions.pageId, page.id))
      .orderBy(desc(schema.pageRevisions.createdAt));
    const old = revs.slice(25).map((r) => r.id);
    if (old.length)
      await tx
        .delete(schema.pageRevisions)
        .where(inArray(schema.pageRevisions.id, old));
  });

  for (const id of [...new Set([...doc.sections.map((s) => s.id)])]) {
    const s = cleaned.find((c) => c.id === id)!;
    await setMediaUsage(db, "section", id, findMediaRefs(s.props));
  }
  await setMediaUsage(
    db,
    "page",
    page.id,
    doc.settings.ogMedia
      ? [{ mediaId: doc.settings.ogMedia.id, fieldPath: "share image" }]
      : [],
  );
  // Usage rows of sections that no longer exist
  const liveIds = new Set(cleaned.map((s) => s.id));
  const stale = await db
    .select({ entityId: schema.mediaUsage.entityId })
    .from(schema.mediaUsage)
    .where(eq(schema.mediaUsage.entityType, "section"));
  const existingSections = new Set(
    (await db.select({ id: schema.sections.id }).from(schema.sections)).map(
      (r) => r.id,
    ),
  );
  for (const row of stale)
    if (!liveIds.has(row.entityId) && !existingSections.has(row.entityId))
      await setMediaUsage(db, "section", row.entityId, []);

  return { tags: [...tags], slug: newSlug };
}
