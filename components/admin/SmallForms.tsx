"use client";

import {
  saveCredit,
  saveTestimonial,
  saveTopic,
} from "@/app/admin/actions-small";
import { ActionForm } from "./ActionForm";
import {
  RepeaterField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "./fields";
import { ImageField } from "./ImageField";
import type { PickedMedia } from "./MediaPicker";

type Base = { id: string | null; defaults: Record<string, unknown> };

export function CreditForm({
  id,
  defaults,
  image,
}: Base & { image: PickedMedia | null }) {
  return (
    <ActionForm
      action={saveCredit.bind(null, id)}
      defaults={defaults}
      submitLabel={id ? "Save credit" : "Add credit"}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <TextField name="title" label="Title" required />
        <SelectField
          name="category"
          label="Type"
          options={[
            ["stage", "Stage play"],
            ["film", "Film"],
            ["tv", "TV"],
            ["other", "Other"],
          ]}
        />
        <TextField
          name="roles"
          label="Roles"
          hint="Separate with commas, e.g. Writer, Director, Producer"
        />
        <TextField name="year" label="Year" type="number" />
        <TextField
          name="sortOrder"
          label="Order"
          type="number"
          hint="Smaller numbers come first."
        />
        <ToggleField
          name="featured"
          label="Featured (highlighted on the page)"
        />
      </div>
      <TextAreaField name="description" label="Description" rows={4} />
      <ImageField name="imageMediaId" label="Photo" initial={image} />
      <RepeaterField
        name="watchLinks"
        label="Where to watch"
        columns={[
          { key: "label", label: "Button label", placeholder: "Watch on Tubi" },
          { key: "url", label: "Address", placeholder: "https://…" },
        ]}
        addLabel="Add a watch link"
      />
    </ActionForm>
  );
}

export function TopicForm({ id, defaults }: Base) {
  return (
    <ActionForm
      action={saveTopic.bind(null, id)}
      defaults={defaults}
      submitLabel={id ? "Save topic" : "Add topic"}
    >
      <TextField name="title" label="Title" required />
      <TextAreaField name="description" label="Description" rows={4} />
      <TextField
        name="sortOrder"
        label="Order"
        type="number"
        hint="Smaller numbers come first."
      />
    </ActionForm>
  );
}

export function TestimonialForm({
  id,
  defaults,
  portrait,
}: Base & { portrait: PickedMedia | null }) {
  return (
    <ActionForm
      action={saveTestimonial.bind(null, id)}
      defaults={defaults}
      submitLabel={id ? "Save testimonial" : "Add testimonial"}
    >
      <TextAreaField name="quote" label="Quote" rows={5} required />
      <div className="grid gap-6 md:grid-cols-2">
        <TextField name="name" label="Name" required />
        <TextField name="org" label="Organization" />
        <SelectField
          name="context"
          label="About"
          options={[
            ["speaking", "Speaking"],
            ["book", "A book"],
          ]}
        />
        <TextField name="sortOrder" label="Order" type="number" />
      </div>
      <ImageField
        name="portraitMediaId"
        label="Portrait (optional)"
        initial={portrait}
      />
      <ToggleField
        name="approved"
        label="Approved (only approved testimonials appear on the website)"
      />
    </ActionForm>
  );
}
