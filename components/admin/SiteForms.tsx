"use client";

import { saveNavigation, saveSettings } from "@/app/admin/actions-site";
import { ActionForm } from "./ActionForm";
import { ImageField } from "./ImageField";
import { ThemePicker } from "./ThemePicker";
import type { PickedMedia } from "./MediaPicker";
import {
  RepeaterField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "./fields";

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
  shareImage,
}: {
  defaults: Record<string, unknown>;
  shareImage: PickedMedia | null;
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
          Colors
        </h2>
        <ThemePicker />
      </section>
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
          Motion
        </h2>
        <ToggleField
          name="motionOn"
          label="Animate sections as visitors scroll"
          hint="Sections fade up gently as they come into view. Visitors who have “reduce motion” turned on in their device settings never see animation. You can also set it for a single section in the page builder."
        />
        <SelectField
          name="motionLevel"
          label="Animation style"
          hint="Bold: sections scale in, text rises one piece at a time, photos wipe in and drift as you scroll. Gentle: a soft fade up."
          options={[
            ["bold", "Bold"],
            ["gentle", "Gentle"],
          ]}
        />
      </section>
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
          Sharing
        </h2>
        <ImageField
          name="shareImage"
          label="Default share photo"
          hint="Shown when a page without its own share photo is shared on Facebook, LinkedIn, X and in messages. Leave empty to use the home page's first photo."
          initial={shareImage}
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
