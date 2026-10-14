import { SettingsForm } from "@/components/admin/SiteForms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import { getMediaById } from "@/lib/media/refs";

export default async function SettingsAdmin() {
  await requireAdmin();
  const rows = await getDb().select().from(schema.siteSettings);
  const get = <T,>(k: string, f: T): T =>
    (rows.find((r) => r.key === k)?.value as T | undefined) ?? f;
  const social = get<Array<{ key: string; href: string | null }>>("social", []);
  const shareId = get<{ id?: string | null }>("share_image", {}).id;
  const share = await getMediaById(shareId);
  const ann = get("announcement", { on: false, text: "", link: "" });
  const defaults: Record<string, unknown> = {
    affiliates: get("affiliates", []),
    categories: get<string[]>("journal_categories", []).join("\n"),
    motionOn: get<{ enabled?: boolean }>("motion", {}).enabled !== false,
    motionLevel:
      get<{ level?: string }>("motion", {}).level === "gentle"
        ? "gentle"
        : "bold",
    announcementOn: ann.on,
    announcementText: ann.text,
    announcementLink: ann.link,
  };
  for (const s of social) defaults[s.key] = s.href ?? "";
  return (
    <>
      <PageHeader title="Site settings" />
      <SettingsForm
        defaults={defaults}
        shareImage={
          share ? { id: share.id, url: share.url, alt: share.alt } : null
        }
      />
    </>
  );
}
