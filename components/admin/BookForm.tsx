"use client";

import { saveBook } from "@/app/admin/actions-books";
import { ActionForm } from "./ActionForm";
import {
  RepeaterField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "./fields";
import { ImageField } from "./ImageField";
import { RichTextField } from "./RichTextField";
import type { PickedMedia } from "./MediaPicker";

export type BookFormData = {
  id: string | null;
  defaults: Record<string, unknown>;
  cover: PickedMedia | null;
  lifestyle: PickedMedia | null;
};

export function BookForm({ id, defaults, cover, lifestyle }: BookFormData) {
  return (
    <ActionForm
      action={saveBook.bind(null, id)}
      defaults={defaults}
      submitLabel={id ? "Save book" : "Create book"}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <TextField name="title" label="Title" required />
        <TextField
          name="slug"
          label="Web address"
          hint="Leave empty to make it from the title. Appears as /books/your-address"
        />
        <TextField name="subtitle" label="Subtitle" />
        <TextField name="tagline" label="Tagline" />
        <TextField name="seriesName" label="Series name" />
        <TextField
          name="seriesOrder"
          label="Number in the series"
          type="number"
        />
        <SelectField
          name="status"
          label="Status"
          options={[
            ["available", "Available"],
            ["coming_soon", "Coming soon"],
          ]}
        />
        <TextField
          name="sortOrder"
          label="Order on the Books page"
          type="number"
          hint="Smaller numbers come first."
        />
      </div>
      <TextAreaField
        name="shortBlurb"
        label="Short blurb"
        rows={3}
        hint="Shown on the homepage and book cards."
      />
      <RichTextField name="synopsisHtml" label="Full synopsis" />
      <div className="grid gap-6 md:grid-cols-2">
        <ImageField name="coverMediaId" label="Cover" initial={cover} />
        <ImageField
          name="lifestyleMediaId"
          label="Lifestyle photo"
          hint="The photo of the book in a setting (used in the homepage Featured Book section)."
          initial={lifestyle}
        />
      </div>
      <RepeaterField
        name="links"
        label="Where to buy"
        hint="One button per link, shown on the book page."
        columns={[
          {
            key: "label",
            label: "Button label",
            placeholder: "Buy signed copy",
          },
          { key: "url", label: "Address", placeholder: "https://…" },
        ]}
        addLabel="Add a buy link"
      />
      <ToggleField
        name="published"
        label="Published (visible on the website)"
      />
    </ActionForm>
  );
}
