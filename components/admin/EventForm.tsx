"use client";

import { saveEvent } from "@/app/admin/actions-events";
import { ActionForm } from "./ActionForm";
import { DateTimeField, SelectField, TextField, ToggleField } from "./fields";
import { ImageField } from "./ImageField";
import type { PickedMedia } from "./MediaPicker";
import { RichTextField } from "./RichTextField";

export function EventForm({
  id,
  defaults,
  image,
  zones,
}: {
  id: string | null;
  defaults: Record<string, unknown>;
  image: PickedMedia | null;
  zones: Array<[string, string]>;
}) {
  return (
    <ActionForm
      action={saveEvent.bind(null, id)}
      defaults={defaults}
      submitLabel={id ? "Save event" : "Create event"}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <TextField name="title" label="Event name" required />
        <TextField
          name="slug"
          label="Web address"
          hint="Leave empty to make it from the name."
        />
        <DateTimeField name="startsAt" label="Starts" required />
        <DateTimeField name="endsAt" label="Ends (optional)" />
        <SelectField name="timezone" label="Time zone" options={zones} />
        <ToggleField
          name="isVirtual"
          label="This is a virtual (online) event"
        />
        <TextField name="venueName" label="Venue name" />
        <TextField name="address" label="Street address" />
        <TextField name="city" label="City" />
        <TextField name="state" label="State" />
      </div>
      <TextField
        name="registrationUrl"
        label="Registration / tickets link"
        placeholder="https://…"
      />
      <ImageField name="imageMediaId" label="Event photo" initial={image} />
      <RichTextField name="descriptionHtml" label="Description" />
      <RichTextField
        name="recapHtml"
        label="Recap (after the event)"
        hint="Shown on past events."
        images
      />
      <ToggleField
        name="published"
        label="Published (visible on the website)"
      />
    </ActionForm>
  );
}
