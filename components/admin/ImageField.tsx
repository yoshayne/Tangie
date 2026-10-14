"use client";

import { useState } from "react";
import { Field } from "./fields";
import { MediaPicker, type PickedMedia } from "./MediaPicker";

/** A photo field: shows the current photo with "Choose from library / Upload new" and "Remove". */
export function ImageField({
  name,
  label,
  hint,
  initial,
}: {
  name: string;
  label: string;
  hint?: string;
  initial?: PickedMedia | null;
}) {
  const [value, setValue] = useState<PickedMedia | null>(initial ?? null);
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} name={name} hint={hint}>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <div className="flex flex-wrap items-center gap-4 border border-line bg-white p-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.url}
            alt={value.alt}
            className="h-24 w-24 bg-sand object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center bg-[#efece6] text-xs text-stone">
            No photo
          </div>
        )}
        <div className="space-y-2">
          {value ? (
            <p className="max-w-xs text-sm text-stone">
              {value.alt || "No description yet"}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="border border-bronze-light px-4 py-2 text-sm text-bronze"
            >
              {value ? "Change photo" : "Choose or upload a photo"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => setValue(null)}
                className="border border-line px-4 py-2 text-sm text-[#9b2c2c]"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {open ? (
        <MediaPicker
          onClose={() => setOpen(false)}
          onPick={(m) => {
            setValue(m);
            setOpen(false);
          }}
        />
      ) : null}
    </Field>
  );
}
