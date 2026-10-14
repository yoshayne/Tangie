"use client";

import { saveNavigation, saveSettings } from "@/app/admin/actions-site";
import { ActionForm } from "./ActionForm";
import { RepeaterField, TextAreaField, TextField, ToggleField } from "./fields";

export function NavigationForm({
  defaults,
  pages,
}: {
  defaults: Record<string, unknown>;
  pages: string[];
}) {
  const cols = [
    { key: "label", label: "Label" },
    { key: "href", label: "Link", placeholder: "/books", suggestions: pages },
  ];
  return (
    <ActionForm
      action={saveNavigation}
      defaults={defaults}
      submitLabel="Save navigation"
    >
      <RepeaterField
        name="header"
        label="Top menu"
        hint="Use the arrows to reorder. Start typing a link to pick one of your pages."
        columns={cols}
        max={10}
        addLabel="Add a menu link"
      />
      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          name="ctaLabel"
          label="Menu button label"
          hint="The filled button at the right of the top menu (e.g. Contact). Leave both empty for no button."
        />
        <TextField
          name="ctaHref"
          label="Menu button link"
          placeholder="/contact"
        />
      </div>
      <RepeaterField
        name="footer"
        label="Footer menu"
        columns={cols}
        max={14}
        addLabel="Add a footer link"
      />
    </ActionForm>
  );
}

const SOCIALS: Array<[string, string]> = [
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["youtube", "YouTube"],
  ["tiktok", "TikTok"],
  ["linkedin", "LinkedIn"],
  ["x", "X (Twitter)"],
];

export function SettingsForm({
  defaults,
}: {
  defaults: Record<string, unknown>;
}) {
  return (
    <ActionForm
      action={saveSettings}
      defaults={defaults}
      submitLabel="Save settings"
    >
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
          Announcement bar
        </h2>
        <ToggleField
          name="announcementOn"
          label="Show the bar at the top of every page"
        />
        <TextField name="announcementText" label="Text" />
        <TextField
          name="announcementLink"
          label="Link (optional)"
          placeholder="/events"
        />
      </section>
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
          Social media
        </h2>
        <p className="text-sm text-stone">
          Leave a link empty to hide that icon in the footer.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {SOCIALS.map(([k, l]) => (
            <TextField key={k} name={k} label={l} placeholder="https://…" />
          ))}
        </div>
      </section>
      <RepeaterField
        name="affiliates"
        label="Partner links (footer)"
        columns={[
          { key: "label", label: "Name" },
          { key: "href", label: "Address", placeholder: "https://…" },
        ]}
        max={6}
        addLabel="Add a partner"
      />
      <TextAreaField
        name="categories"
        label="Journal categories"
        rows={6}
        hint="One per line. These appear as filters on the Journal and in the post editor."
      />
    </ActionForm>
  );
}
