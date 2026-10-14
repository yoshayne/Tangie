"use client";

import { useState } from "react";
import { useAdminForm } from "./ActionForm";
import { Field } from "./fields";
import { RichEditor } from "./RichEditor";

/** A rich-text field inside an ActionForm: the HTML travels in a hidden input. */
export function RichTextField({
  name,
  label,
  hint,
  images = false,
  minHeight = 220,
}: {
  name: string;
  label: string;
  hint?: string;
  images?: boolean;
  minHeight?: number;
}) {
  const { state, defaults } = useAdminForm();
  const initial = state.values?.[name] ?? String(defaults[name] ?? "");
  const [html, setHtml] = useState(initial);
  return (
    <Field label={label} name={name} hint={hint}>
      <input type="hidden" name={name} value={html} />
      <RichEditor
        id={`f-${name}`}
        value={initial}
        onChange={setHtml}
        images={images}
        minHeight={minHeight}
      />
    </Field>
  );
}
