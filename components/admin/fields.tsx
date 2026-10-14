"use client";

import { useState } from "react";
import { useAdminForm } from "./ActionForm";

const INPUT =
  "w-full border border-line bg-white px-3 py-2.5 text-[15px] disabled:bg-[#f0eee9]";

export function Field({
  label,
  name,
  hint,
  required,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const { state } = useAdminForm();
  const error = state.errors?.[name];
  return (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1 block text-sm font-semibold">
        {label}
        {required ? <span className="text-bronze"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
      {error ? <p className="mt-1 text-sm text-[#9b2c2c]">{error}</p> : null}
    </div>
  );
}

function useValue(name: string): string {
  const { state, defaults } = useAdminForm();
  const typed = state.values?.[name];
  if (typed !== undefined) return typed;
  const d = defaults[name];
  return d === undefined || d === null ? "" : String(d);
}

export function TextField(props: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  type?: "text" | "email" | "url" | "tel" | "number";
  placeholder?: string;
}) {
  const value = useValue(props.name);
  return (
    <Field {...props}>
      <input
        id={`f-${props.name}`}
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={value}
        placeholder={props.placeholder}
        className={INPUT}
      />
    </Field>
  );
}

export function TextAreaField(props: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  rows?: number;
}) {
  const value = useValue(props.name);
  return (
    <Field {...props}>
      <textarea
        id={`f-${props.name}`}
        name={props.name}
        rows={props.rows ?? 4}
        defaultValue={value}
        className={INPUT}
      />
    </Field>
  );
}

export function SelectField(props: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  options: Array<[value: string, label: string]>;
}) {
  const value = useValue(props.name);
  return (
    <Field {...props}>
      <select
        id={`f-${props.name}`}
        name={props.name}
        defaultValue={value}
        className={INPUT}
      >
        {props.options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function DateTimeField(props: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
}) {
  const value = useValue(props.name);
  return (
    <Field {...props}>
      <input
        id={`f-${props.name}`}
        name={props.name}
        type="datetime-local"
        defaultValue={value}
        className={INPUT}
      />
    </Field>
  );
}

export function ToggleField({
  name,
  label,
  hint,
}: {
  name: string;
  label: string;
  hint?: string;
}) {
  const { state, defaults } = useAdminForm();
  const checked = state.values ? name in state.values : Boolean(defaults[name]);
  return (
    <div>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          name={name}
          defaultChecked={checked}
          className="h-5 w-5 accent-[#8c6b3f]"
        />
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
    </div>
  );
}

/** Rows of short text inputs (e.g. book links). The rows are sent as JSON in a hidden field. */
export function RepeaterField({
  name,
  label,
  hint,
  columns,
  max = 10,
  addLabel = "Add another",
}: {
  name: string;
  label: string;
  hint?: string;
  columns: Array<{
    key: string;
    label: string;
    placeholder?: string;
    suggestions?: string[];
  }>;
  max?: number;
  addLabel?: string;
}) {
  const { state, defaults } = useAdminForm();
  const initial = (() => {
    try {
      const v = state.values?.[name];
      if (v) return JSON.parse(v) as Array<Record<string, string>>;
    } catch {
      /* fall through */
    }
    return (defaults[name] as Array<Record<string, string>> | undefined) ?? [];
  })();
  const [rows, setRows] = useState<Array<Record<string, string>>>(initial);
  const update = (i: number, key: string, value: string) =>
    setRows((r) =>
      r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)),
    );
  const move = (i: number, d: number) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const copy = [...r];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <Field label={label} name={name} hint={hint}>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex flex-wrap items-end gap-2 border border-line bg-white p-3"
          >
            {columns.map((c) => (
              <label
                key={c.key}
                className="min-w-[10rem] flex-1 text-xs font-semibold"
              >
                {c.label}
                <input
                  value={row[c.key] ?? ""}
                  onChange={(e) => update(i, c.key, e.target.value)}
                  placeholder={c.placeholder}
                  list={c.suggestions ? `${name}-${c.key}-list` : undefined}
                  className="mt-1 w-full border border-line px-2 py-2 text-[15px] font-normal"
                />
                {c.suggestions ? (
                  <datalist id={`${name}-${c.key}-list`}>
                    {c.suggestions.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                ) : null}
              </label>
            ))}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="h-9 w-9 border border-line"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="h-9 w-9 border border-line"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                className="h-9 border border-line px-3 text-[#9b2c2c]"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {rows.length < max ? (
          <button
            type="button"
            onClick={() => setRows((r) => [...r, {}])}
            className="border border-bronze-light px-4 py-2 text-sm text-bronze"
          >
            + {addLabel}
          </button>
        ) : null}
      </div>
    </Field>
  );
}
