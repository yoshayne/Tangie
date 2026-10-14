"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createPreviewToken, requireAdminAction } from "@/lib/admin/auth";
import {
  fail,
  parseForm,
  slugify,
  type AdminFormState,
} from "@/lib/admin/form";
import { invalidate } from "@/lib/admin/invalidate";
import { req } from "@/lib/admin/zod";
import { getDb, schema } from "@/lib/db";
import { getMediaById, toImageRef } from "@/lib/media/refs";
import { setMediaUsage } from "@/lib/media/usage";
import {
  loadWorkingDoc,
  publishDoc,
  validateDoc,
  validateSlug,
} from "@/lib/page-builder/server";
import type { DraftDoc, Issue } from "@/lib/page-builder/types";
import { SECTION_META } from "@/lib/sections/meta";
import type { ImageRef } from "@/lib/sections/types";

const uuid = z.string().regex(/^[0-9a-f-]{36}$/i);

async function getPage(id: string) {
  if (!uuid.safeParse(id).success) return null;
  const [p] = await getDb()
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.id, id))
    .limit(1);
  return p ?? null;
}

// ---------------------------------------------------------------------------
// Pages: create, duplicate, delete
// ---------------------------------------------------------------------------
const NewPageForm = z.object({
  title: req("Page name", 80),
  slug: z.string().trim().max(60).optional(),
});

export async function createPage(
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();
  const parsed = parseForm(NewPageForm, fd);
  if (!parsed.ok) return parsed.state;
  const slug = slugify(parsed.data.slug || parsed.data.title);
  const db = getDb();
  const problem = await validateSlug({ slug: "", isSystem: false }, slug);
  if (problem) return fail(problem, parsed.values, { slug: problem });

  const doc: DraftDoc = {
    sections: [
      {
        id: crypto.randomUUID(),
        type: "page_hero",
        props: {
          ...SECTION_META.page_hero.defaults,
          heading: parsed.data.title,
        },
        anchorId: null,
        hidden: false,
      },
    ],
    settings: {
      title: parsed.data.title,
      slug,
      seoTitle: "",
      seoDescription: "",
      ogMedia: null,
      showInMenu: false,
    },
  };
  const [page] = await db
    .insert(schema.pages)
    .values({
      slug,
      title: parsed.data.title,
      status: "draft",
      isSystem: false,
      draft: doc as unknown as Record<string, unknown>,
    })
    .returning();
  redirect(`/admin/pages/${page.id}`);
}

export async function duplicatePage(id: string) {
  await requireAdminAction();
  const working = await loadWorkingDoc(id);
  if (!working) return;
  const db = getDb();
  let slug = `${working.page.slug || "home"}-copy`.replace(/^_template\//, "");
  for (let n = 2; ; n++) {
    const taken = await db
      .select({ id: schema.pages.id })
      .from(schema.pages)
      .where(eq(schema.pages.slug, slug))
      .limit(1);
    if (!taken.length) break;
    slug = `${working.page.slug || "home"}-copy-${n}`;
  }
  const doc: DraftDoc = {
    sections: working.doc.sections.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
    })),
    settings: {
      ...working.doc.settings,
      title: `${working.doc.settings.title} (copy)`,
      slug,
      showInMenu: false,
    },
  };
  const [page] = await db
    .insert(schema.pages)
    .values({
      slug,
      title: doc.settings.title,
      status: "draft",
      isSystem: false,
      draft: doc as unknown as Record<string, unknown>,
    })
    .returning();
  redirect(`/admin/pages/${page.id}`);
}

export async function deletePage(
  id: string,
  confirmName: string,
  redirectTo: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAction();
  const page = await getPage(id);
  if (!page) return { ok: false, error: "That page no longer exists." };
  if (page.isSystem)
    return { ok: false, error: "Built-in pages cannot be deleted." };
  if (confirmName.trim() !== page.title)
    return {
      ok: false,
      error: "The name you typed does not match the page name.",
    };
  const target = redirectTo.startsWith("/") ? redirectTo : "/";
  const db = getDb();
  const secs = await db
    .select({ id: schema.sections.id })
    .from(schema.sections)
    .where(eq(schema.sections.pageId, id));
  await db.transaction(async (tx) => {
    await tx.delete(schema.navItems).where(eq(schema.navItems.pageId, id));
    if (page.status === "published")
      await tx
        .insert(schema.redirects)
        .values({ fromPath: `/${page.slug}`, toPath: target, statusCode: 301 })
        .onConflictDoUpdate({
          target: schema.redirects.fromPath,
          set: { toPath: target },
        });
    await tx.delete(schema.pages).where(eq(schema.pages.id, id));
  });
  for (const s of secs) await setMediaUsage(db, "section", s.id, []);
  await setMediaUsage(db, "page", id, []);
  invalidate([`page:${page.slug}`, "nav"]);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------
const DocInput = z.object({
  sections: z
    .array(
      z.object({
        id: uuid,
        type: z.string().max(40),
        props: z.record(z.string(), z.unknown()),
        anchorId: z.string().max(60).nullable(),
        hidden: z.boolean(),
      }),
    )
    .max(80),
  settings: z.object({
    title: z.string().max(80),
    slug: z.string().max(60),
    seoTitle: z.string().max(120),
    seoDescription: z.string().max(320),
    ogMedia: z
      .object({ id: uuid, url: z.string().max(300), alt: z.string().max(300) })
      .nullable(),
    showInMenu: z.boolean(),
  }),
});

export async function saveDraft(
  pageId: string,
  doc: unknown,
): Promise<{ ok: boolean; error?: string; savedAt?: string }> {
  await requireAdminAction();
  const page = await getPage(pageId);
  if (!page) return { ok: false, error: "That page no longer exists." };
  const parsed = DocInput.safeParse(doc);
  if (!parsed.success)
    return {
      ok: false,
      error: "The draft could not be saved (invalid content).",
    };
  const known = parsed.data.sections.filter((s) => SECTION_META[s.type]);
  if (known.length !== parsed.data.sections.length)
    return { ok: false, error: "The draft contains an unknown section type." };
  if (JSON.stringify(parsed.data).length > 2_000_000)
    return { ok: false, error: "This page is too large to save." };
  const data: DraftDoc = {
    ...parsed.data,
    // Built-in pages keep their address.
    settings: page.isSystem
      ? { ...parsed.data.settings, slug: page.slug }
      : parsed.data.settings,
  };
  await getDb()
    .update(schema.pages)
    .set({ draft: data as unknown as Record<string, unknown> })
    .where(eq(schema.pages.id, pageId));
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function discardDraft(pageId: string) {
  await requireAdminAction();
  await getDb()
    .update(schema.pages)
    .set({ draft: null })
    .where(eq(schema.pages.id, pageId));
}

export async function checkDraft(pageId: string): Promise<Issue[]> {
  await requireAdminAction();
  const working = await loadWorkingDoc(pageId);
  if (!working)
    return [
      {
        level: "error",
        sectionId: null,
        message: "That page no longer exists.",
      },
    ];
  return validateDoc(working.page, working.doc);
}

export async function publishPage(
  pageId: string,
  note: string,
): Promise<{ ok: boolean; issues: Issue[]; slug?: string }> {
  const admin = await requireAdminAction();
  const working = await loadWorkingDoc(pageId);
  if (!working)
    return {
      ok: false,
      issues: [
        {
          level: "error",
          sectionId: null,
          message: "That page no longer exists.",
        },
      ],
    };
  const issues = await validateDoc(working.page, working.doc);
  if (issues.some((i) => i.level === "error")) return { ok: false, issues };
  const result = await publishDoc(working.page, working.doc, note, admin.id);
  invalidate(result.tags);
  return { ok: true, issues, slug: result.slug };
}

export async function unpublishPage(pageId: string) {
  await requireAdminAction();
  const page = await getPage(pageId);
  if (!page || page.isSystem) return;
  const db = getDb();
  await db
    .update(schema.pages)
    .set({ status: "draft" })
    .where(eq(schema.pages.id, pageId));
  await db.delete(schema.navItems).where(eq(schema.navItems.pageId, pageId));
  invalidate([`page:${page.slug}`, "nav"]);
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
export type RevisionItem = {
  id: string;
  createdAt: string;
  note: string | null;
};

export async function listRevisions(pageId: string): Promise<RevisionItem[]> {
  await requireAdminAction();
  const rows = await getDb()
    .select()
    .from(schema.pageRevisions)
    .where(eq(schema.pageRevisions.pageId, pageId))
    .orderBy(desc(schema.pageRevisions.createdAt));
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    note: r.note,
  }));
}

/** Loads an older published version into the draft so it can be reviewed before publishing. */
export async function restoreRevision(
  pageId: string,
  revisionId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAction();
  const page = await getPage(pageId);
  if (!page) return { ok: false, error: "That page no longer exists." };
  const [rev] = await getDb()
    .select()
    .from(schema.pageRevisions)
    .where(
      and(
        eq(schema.pageRevisions.id, revisionId),
        eq(schema.pageRevisions.pageId, pageId),
      ),
    );
  if (!rev) return { ok: false, error: "That version no longer exists." };
  const parsed = DocInput.safeParse(rev.snapshot);
  if (!parsed.success)
    return { ok: false, error: "That version cannot be restored." };
  const doc: DraftDoc = {
    ...parsed.data,
    settings: page.isSystem
      ? { ...parsed.data.settings, slug: page.slug }
      : parsed.data.settings,
  };
  await getDb()
    .update(schema.pages)
    .set({ draft: doc as unknown as Record<string, unknown> })
    .where(eq(schema.pages.id, pageId));
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Helpers for the editor
// ---------------------------------------------------------------------------
export async function getImageRef(mediaId: string): Promise<ImageRef | null> {
  await requireAdminAction();
  if (!uuid.safeParse(mediaId).success) return null;
  const m = await getMediaById(mediaId);
  return m && m.kind === "image" ? toImageRef(m) : null;
}

export async function getPreviewToken(pageId: string): Promise<string> {
  await requireAdminAction();
  return createPreviewToken(pageId);
}

export type SavedBlock = {
  id: string;
  name: string;
  type: string;
  props: Record<string, unknown>;
};

export async function listSavedBlocks(): Promise<SavedBlock[]> {
  await requireAdminAction();
  const rows = await getDb()
    .select()
    .from(schema.sectionTemplates)
    .orderBy(asc(schema.sectionTemplates.name));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    props: r.props,
  }));
}

export async function saveBlock(
  name: string,
  type: string,
  props: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminAction();
  const n = name.trim().slice(0, 60);
  if (!n) return { ok: false, error: "Give the block a name." };
  if (!SECTION_META[type]) return { ok: false, error: "Unknown section type." };
  await getDb()
    .insert(schema.sectionTemplates)
    .values({ name: n, type, props });
  return { ok: true };
}

export async function deleteBlock(id: string) {
  await requireAdminAction();
  if (!uuid.safeParse(id).success) return;
  await getDb()
    .delete(schema.sectionTemplates)
    .where(inArray(schema.sectionTemplates.id, [id]));
}
