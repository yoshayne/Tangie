"use client";

import { createPage } from "@/app/admin/actions-pages";
import { ActionForm } from "./ActionForm";
import { TextField } from "./fields";

export function NewPageForm() {
  return (
    <ActionForm action={createPage} submitLabel="Create page and start editing">
      <TextField
        name="title"
        label="Page name"
        required
        hint="For example: Workshops"
      />
      <TextField
        name="slug"
        label="Web address"
        hint="Leave empty to make it from the name. You can change it later."
      />
    </ActionForm>
  );
}
