"use client";

import { savePost } from "@/app/admin/actions-posts";
import { ActionForm } from "./ActionForm";
import { DateTimeField, SelectField, TextAreaField, TextField } from "./fields";
import { ImageField } from "./ImageField";
import type { PickedMedia } from "./MediaPicker";
import { RichTextField } from "./RichTextField";

export function PostForm({
  id,
  defaults,
  cover,
  categories,
}: {
  id: string | null;
  defaults: Record<string, unknown>;
  cover: PickedMedia | null;
  categories: string[];
}) {
  return (
    <ActionForm
      action={savePost.bind(null, id)}
      defaults={defaults}
      submitLabel={id ? "Save post" : "Create post"}
    >
      <TextField name="title" label="Title" required />
      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          name="slug"
          label="Web address"
          hint="Leave empty to make it from the title."
        />
        <SelectField
          name="category"
          label="Category"
          options={[
            ["", "— none —"],
            ...categories.map((c): [string, string] => [c, c]),
          ]}
        />
        <SelectField
          name="status"
          label="Status"
          options={[
            ["draft", "Draft (not visible)"],
            ["published", "Published"],
          ]}
        />
        <DateTimeField
          name="publishedAt"
          label="Publish date"
          hint="Leave empty to use right now when you publish."
        />
        <TextField name="authorName" label="Author" required />
      </div>
      <ImageField name="coverMediaId" label="Cover photo" initial={cover} />
      <TextAreaField
        name="excerpt"
        label="Short summary"
        rows={3}
        hint="Used in search results and when the post is shared."
      />
      <RichTextField name="bodyHtml" label="Post" images minHeight={380} />
      <details className="border border-line bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Search engine settings (optional)
        </summary>
        <div className="mt-4 space-y-6">
          <TextField name="seoTitle" label="Search title" />
          <TextAreaField
            name="seoDescription"
            label="Search description"
            rows={3}
          />
        </div>
      </details>
    </ActionForm>
  );
}
