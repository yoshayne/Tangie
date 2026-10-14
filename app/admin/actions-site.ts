"use server";

import { z } from "zod";
import { requireAdminAction } from "@/lib/admin/auth";
import { fail, parseForm, type AdminFormState } from "@/lib/admin/form";
import { invalidate } from "@/lib/admin/invalidate";
import { bool, opt, rows, uuidOrNull } from "@/lib/admin/zod";
import { getDb, schema } from "@/lib/db";
import { setMediaUsage } from "@/lib/media/usage";

const linkOk = (v: string) =>
  v.startsWith("/") || /^https:\/\//i.test(v) || /^mailto:/i.test(v);

// ---------------- Navigation ----------------
const NavForm = z.object({
  header: rows(
    z.object({
      label: z.string().trim().max(40),
      href: z.string().trim().max(300),
    }),
  ),
  footer: rows(
    z.object({
      label: z.string().trim().max(40),
      href: z.string().trim().max(300),
    }),
  ),
  ctaLabel: opt(40),
  ctaHref: opt(300),
});

export async function saveNavigation(
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();
  const parsed = parseForm(NavForm, fd);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  const header = d.header.filter((r) => r.label || r.href);
  const footer = d.footer.filter((r) => r.label || r.href);
  for (const r of [...header, ...footer])
    if (!r.label || !linkOk(r.href))
      return fail(
        `“${r.label || "(no label)"}” needs a label and a link starting with / or https://`,
        parsed.values,
      );
  if (!!d.ctaLabel !== !!d.ctaHref || (d.ctaHref && !linkOk(d.ctaHref)))
    return fail(
      "The menu button needs both a label and a link starting with / or https:// (or leave both empty).",
      parsed.values,
    );

  const db = getDb();
  const pageRows = await db
    .select({ id: schema.pages.id, slug: schema.pages.slug })
    .from(schema.pages);
  const pageId = (href: string) =>
    pageRows.find((p) => `/${p.slug}` === href)?.id ?? null;
  const items = [
    ...header.map((r, i) => ({
      location: "header" as const,
      label: r.label,
      href: r.href,
      pageId: pageId(r.href),
      sortOrder: i + 1,
      isButton: false,
    })),
    ...(d.ctaLabel && d.ctaHref
      ? [
          {
            location: "header" as const,
            label: d.ctaLabel,
            href: d.ctaHref,
            pageId: pageId(d.ctaHref),
            sortOrder: 99,
            isButton: true,
          },
        ]
      : []),
    ...footer.map((r, i) => ({
      location: "footer" as const,
      label: r.label,
      href: r.href,
      pageId: pageId(r.href),
      sortOrder: i + 1,
      isButton: false,
    })),
  ];
  await db.transaction(async (tx) => {
    await tx.delete(schema.navItems);
    if (items.length) await tx.insert(schema.navItems).values(items);
  });
  invalidate(["nav"]);
  return { status: "success", message: "Navigation saved." };
}

// ---------------- Site settings ----------------
const SOCIAL_KEYS = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "linkedin",
  "x",
] as const;
const SOCIAL_LABEL: Record<(typeof SOCIAL_KEYS)[number], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
};

const httpsOrEmpty = (label: string) =>
  z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      if (!/^https:\/\//i.test(v))
        ctx.addIssue({
          code: "custom",
          message: `${label} must start with https://`,
        });
      return v;
    });

const SettingsForm = z.object({
  facebook: httpsOrEmpty("Facebook link"),
  instagram: httpsOrEmpty("Instagram link"),
  youtube: httpsOrEmpty("YouTube link"),
  tiktok: httpsOrEmpty("TikTok link"),
  linkedin: httpsOrEmpty("LinkedIn link"),
  x: httpsOrEmpty("X link"),
  affiliates: rows(
    z.object({
      label: z.string().trim().max(80),
      href: z.string().trim().max(300),
    }),
  ),
  categories: z.string().max(2000).optional(),
  shareImage: uuidOrNull,
  motionOn: bool,
  announcementOn: bool,
  announcementText: opt(200),
  announcementLink: opt(300),
});

export async function saveSettings(
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireAdminAction();
  const parsed = parseForm(SettingsForm, fd);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  const affiliates = d.affiliates.filter((a) => a.label || a.href);
  for (const a of affiliates)
    if (!a.label || !/^https:\/\//i.test(a.href))
      return fail(
        "Each partner link needs a label and an address starting with https://",
        parsed.values,
      );
  if (d.announcementOn && !d.announcementText)
    return fail(
      "Type the announcement text, or switch the bar off.",
      parsed.values,
      { announcementText: "Required when the bar is on." },
    );
  if (d.announcementLink && !linkOk(d.announcementLink))
    return fail(
      "The announcement link must start with / or https://",
      parsed.values,
      { announcementLink: "Check the link." },
    );

  const categories = [
    ...new Set(
      (d.categories ?? "")
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ];
  const settings: Record<string, unknown> = {
    social: SOCIAL_KEYS.map((key) => ({
      key,
      label: SOCIAL_LABEL[key],
      href: d[key],
    })),
    affiliates,
    journal_categories: categories,
    share_image: { id: d.shareImage },
    motion: { enabled: d.motionOn },
    announcement: {
      on: d.announcementOn,
      text: d.announcementText ?? "",
      link: d.announcementLink ?? "",
    },
  };
  const db = getDb();
  for (const [key, value] of Object.entries(settings))
    await db
      .insert(schema.siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value } });
  await setMediaUsage(
    db,
    "settings",
    "share_image",
    d.shareImage
      ? [{ mediaId: d.shareImage, fieldPath: "default share photo" }]
      : [],
  );
  invalidate(["settings"]);
  return { status: "success", message: "Settings saved." };
}
