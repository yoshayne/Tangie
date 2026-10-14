"use client";

import { useId, useRef, useState } from "react";
import { getImageRef } from "@/app/admin/actions-pages";
import { setMediaAlt } from "@/app/admin/actions-media";
import { uploadFiles, type UploadState } from "@/lib/admin/client-upload";
import { BACKGROUNDS, type FieldSpec } from "@/lib/sections/meta";
import type { ImageRef } from "@/lib/sections/types";
import { ImageAdjuster } from "./ImageAdjuster";
import { MediaPicker } from "../MediaPicker";
import { RichEditor } from "../RichEditor";

export type BuilderCtx = {
  /** Addresses of the site's pages, offered as link suggestions. */
  pages: string[];
  /** [slug, title] of every book. */
  books: Array<[string, string]>;
};

type Obj = Record<string, unknown>;

const INPUT = "w-full border border-line bg-white px-3 py-2 text-[15px]";
const SWATCH: Record<string, string> = {
  ivory: "#F7F4EE",
  "ivory-deep": "#EFEAE2",
  sand: "#E6DCCD",
  white: "#FFFFFF",
  ink: "#1C1A18",
};

function withKey(obj: Obj, name: string, v: unknown): Obj {
  const next = { ...obj };
  if (v === undefined || v === "") {
    // An empty text box means "not set", except for text the page needs to keep as empty text.
    if (v === "") next[name] = "";
    else delete next[name];
  } else next[name] = v;
  return next;
}

function Labeled({
  label,
  hint,
  required,
  htmlFor,
  children,
  extra,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
          {required ? <span className="text-bronze"> *</span> : null}
        </label>
        {extra}
      </div>
      {children}
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
    </div>
  );
}

function Counter({ len, max }: { len: number; max?: number }) {
  if (!max) return null;
  const cls =
    len > max
      ? "text-[#9b2c2c]"
      : len > max * 0.9
        ? "text-[#8a5a00]"
        : "text-stone";
  return (
    <span className={`text-xs ${cls}`}>
      {len}/{max}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Photo
// ---------------------------------------------------------------------------
export function ImageInput({
  value,
  onChange,
  required,
  aspects,
}: {
  value: ImageRef | undefined;
  onChange: (v: ImageRef | undefined) => void;
  required?: boolean;
  /** Frame shapes on the page (width ÷ height). With these, the position tool is offered. */
  aspects?: Array<[string, number]>;
}) {
  const [adjusting, setAdjusting] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alt, setAlt] = useState<string | null>(null);
  const altId = useId();
  const shownAlt = alt ?? value?.alt ?? "";

  async function picked(id: string) {
    setBusy(true);
    const ref = await getImageRef(id);
    setBusy(false);
    setAlt(null);
    if (ref) onChange(ref);
  }

  async function saveAlt() {
    if (!value?.mediaId || alt === null || alt.trim() === value.alt) return;
    const res = await setMediaAlt(value.mediaId, alt);
    if (res.ok) onChange({ ...value, alt: alt.trim() });
  }

  return (
    <div className="border border-line bg-white p-3">
      <div className="flex flex-wrap items-start gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.src}
            alt=""
            className="h-20 w-20 bg-sand object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center bg-[#efece6] text-xs text-stone">
            {required ? "Required" : "No photo"}
          </div>
        )}
        <div className="min-w-[10rem] flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="border border-bronze-light px-3 py-1.5 text-sm text-bronze"
            >
              {busy ? "Loading…" : value ? "Change photo" : "Choose or upload"}
            </button>
            {value && aspects?.length ? (
              <button
                type="button"
                onClick={() => setAdjusting(true)}
                className="border border-bronze-light px-3 py-1.5 text-sm text-bronze"
              >
                Adjust position and size
              </button>
            ) : null}
            {value ? (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="border border-line px-3 py-1.5 text-sm text-[#9b2c2c]"
              >
                Remove
              </button>
            ) : null}
          </div>
          {value ? (
            <div>
              <label htmlFor={altId} className="text-xs font-semibold">
                Describe this photo {required ? "*" : ""}
              </label>
              <input
                id={altId}
                value={shownAlt}
                onChange={(e) => setAlt(e.target.value)}
                onBlur={saveAlt}
                placeholder="e.g. Tangie smiling at her laptop"
                className={`${INPUT} mt-1 py-1.5 text-sm`}
              />
            </div>
          ) : null}
        </div>
      </div>
      {value?.crop ? (
        <p className="mt-2 text-xs text-stone">
          Position and size set by you.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => onChange({ ...value, crop: undefined })}
          >
            Reset
          </button>
        </p>
      ) : null}
      {adjusting && value && aspects?.length ? (
        <ImageAdjuster
          value={value}
          aspects={aspects}
          onClose={() => setAdjusting(false)}
          onApply={(crop) => onChange({ ...value, crop })}
        />
      ) : null}
      {open ? (
        <MediaPicker
          onClose={() => setOpen(false)}
          onPick={(m) => {
            setOpen(false);
            void picked(m.id);
          }}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
type Btn = {
  label: string;
  href: string;
  variant?: string;
  newTab?: boolean;
  track?: string;
};

function ButtonsInput({
  value,
  onChange,
  ctx,
}: {
  value: Btn[];
  onChange: (v: Btn[]) => void;
  ctx: BuilderCtx;
}) {
  const listId = useId();
  const set = (i: number, patch: Partial<Btn>) =>
    onChange(value.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  return (
    <div className="space-y-3">
      <datalist id={listId}>
        {ctx.pages.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {value.map((b, i) => (
        <div key={i} className="space-y-2 border border-line bg-white p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Button text
              <input
                value={b.label}
                maxLength={40}
                onChange={(e) => set(i, { label: e.target.value })}
                className={`${INPUT} mt-1 py-1.5 font-normal`}
              />
            </label>
            <label className="text-xs font-semibold">
              Link
              <input
                value={b.href}
                list={listId}
                placeholder="/contact or https://…"
                onChange={(e) => set(i, { href: e.target.value })}
                className={`${INPUT} mt-1 py-1.5 font-normal`}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              Style
              <select
                value={b.variant ?? "filled"}
                onChange={(e) => set(i, { variant: e.target.value })}
                className="border border-line bg-white px-2 py-1"
              >
                <option value="filled">Filled</option>
                <option value="outline">Outline</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(b.newTab)}
                onChange={(e) => set(i, { newTab: e.target.checked })}
                className="h-4 w-4 accent-[#b34815]"
              />
              Open in a new tab
            </label>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="ml-auto text-[#9b2c2c] underline"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      {value.length < 2 ? (
        <button
          type="button"
          onClick={() =>
            onChange([
              ...value,
              {
                label: "",
                href: "",
                variant: value.length ? "outline" : "filled",
              },
            ])
          }
          className="border border-bronze-light px-3 py-1.5 text-sm text-bronze"
        >
          + Add a button
        </button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Uploading a video or a document into a section
// ---------------------------------------------------------------------------
function UploadButton({
  accept,
  label,
  onDone,
  multiple = false,
}: {
  accept: string;
  label: string;
  multiple?: boolean;
  onDone: (done: UploadState[]) => void;
}) {
  const [states, setStates] = useState<UploadState[]>([]);
  const ref = useRef<HTMLInputElement>(null);
  const working = states.some((s) => s.status === "uploading");
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          const result = await uploadFiles(files, setStates);
          onDone(result);
        }}
      />
      <button
        type="button"
        disabled={working}
        onClick={() => ref.current?.click()}
        className="border border-bronze-light px-3 py-1.5 text-sm text-bronze disabled:opacity-60"
      >
        {working ? "Uploading…" : label}
      </button>
      {states.map((s) => (
        <p key={s.id} className="mt-1 text-xs">
          {s.name}:{" "}
          {s.status === "uploading" ? (
            <>
              {s.progress}%{" "}
              <button type="button" onClick={s.cancel} className="underline">
                cancel
              </button>
            </>
          ) : s.status === "done" ? (
            "uploaded"
          ) : (
            <span className="text-[#9b2c2c]">{s.error}</span>
          )}
        </p>
      ))}
    </div>
  );
}

function sizeLabel(bytes: number) {
  return bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

// ---------------------------------------------------------------------------
// The generated form
// ---------------------------------------------------------------------------
export function FieldList({
  fields,
  value,
  onChange,
  ctx,
  defaults,
  idPrefix = "f",
}: {
  fields: FieldSpec[];
  value: Obj;
  onChange: (v: Obj) => void;
  ctx: BuilderCtx;
  defaults?: Obj;
  idPrefix?: string;
}) {
  const listId = useId();
  return (
    <div className="space-y-5">
      <datalist id={listId}>
        {ctx.pages.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {fields.map((f) => {
        const id = `${idPrefix}-${f.name}`;
        const v = value[f.name];
        const setV = (x: unknown) => onChange(withKey(value, f.name, x));

        switch (f.kind) {
          case "text":
            return (
              <Labeled
                key={f.name}
                label={f.label}
                hint={f.hint}
                required={f.required}
                htmlFor={id}
                extra={<Counter len={String(v ?? "").length} max={f.max} />}
              >
                <input
                  id={id}
                  value={String(v ?? "")}
                  list={f.link ? listId : undefined}
                  onChange={(e) => setV(e.target.value)}
                  className={INPUT}
                />
              </Labeled>
            );
          case "textarea":
            return (
              <Labeled
                key={f.name}
                label={f.label}
                hint={f.hint}
                required={f.required}
                htmlFor={id}
                extra={<Counter len={String(v ?? "").length} max={f.max} />}
              >
                <textarea
                  id={id}
                  rows={f.rows ?? 4}
                  value={String(v ?? "")}
                  onChange={(e) => setV(e.target.value)}
                  className={INPUT}
                />
              </Labeled>
            );
          case "richtext":
            return (
              <Labeled
                key={f.name}
                label={f.label}
                hint={f.hint}
                required={f.required}
              >
                <RichEditor
                  value={String(v ?? "")}
                  onChange={(h) => setV(h)}
                  minHeight={140}
                />
              </Labeled>
            );
          case "image":
            return (
              <Labeled
                key={f.name}
                label={f.label}
                hint={f.hint}
                required={f.required}
              >
                <ImageInput
                  required={f.required}
                  aspects={f.aspects?.(value)}
                  value={v as ImageRef | undefined}
                  onChange={(x) => setV(x)}
                />
              </Labeled>
            );
          case "buttons":
            return (
              <Labeled key={f.name} label={f.label} hint={f.hint}>
                <ButtonsInput
                  value={(v as Btn[]) ?? []}
                  onChange={(x) => setV(x)}
                  ctx={ctx}
                />
              </Labeled>
            );
          case "select": {
            const shown =
              v === undefined || v === null
                ? String(defaults?.[f.name] ?? "")
                : String(v);
            return (
              <Labeled key={f.name} label={f.label} hint={f.hint} htmlFor={id}>
                <select
                  id={id}
                  value={shown}
                  onChange={(e) => {
                    const x = e.target.value;
                    if (x === "") onChange(withKey(value, f.name, undefined));
                    else setV(f.numeric ? Number(x) : x);
                  }}
                  className={INPUT}
                >
                  {f.options.map(([val, lab]) => (
                    <option key={val} value={val}>
                      {lab}
                    </option>
                  ))}
                </select>
              </Labeled>
            );
          }
          case "bookSelect":
            return (
              <Labeled key={f.name} label={f.label} hint={f.hint} htmlFor={id}>
                <select
                  id={id}
                  value={String(v ?? "")}
                  onChange={(e) => setV(e.target.value || undefined)}
                  className={INPUT}
                >
                  <option value="">— none —</option>
                  {ctx.books.map(([slug, title]) => (
                    <option key={slug} value={slug}>
                      {title}
                    </option>
                  ))}
                </select>
              </Labeled>
            );
          case "toggle":
            return (
              <div key={f.name}>
                <label className="flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={Boolean(v ?? defaults?.[f.name])}
                    onChange={(e) => setV(e.target.checked)}
                    className="h-5 w-5 accent-[#b34815]"
                  />
                  {f.label}
                </label>
                {f.hint ? (
                  <p className="mt-1 text-xs text-stone">{f.hint}</p>
                ) : null}
              </div>
            );
          case "number":
            return (
              <Labeled key={f.name} label={f.label} hint={f.hint} htmlFor={id}>
                <input
                  id={id}
                  type="number"
                  min={f.min}
                  max={f.max}
                  value={v === undefined ? "" : Number(v)}
                  onChange={(e) =>
                    setV(
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                    )
                  }
                  className={`${INPUT} max-w-[8rem]`}
                />
              </Labeled>
            );
          case "color":
            return (
              <Labeled key={f.name} label={f.label} hint={f.hint}>
                <div
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label={f.label}
                >
                  {[["", "Default"], ...BACKGROUNDS].map(([val, lab]) => {
                    const on = (v ?? "") === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setV(val || undefined)}
                        className={`flex items-center gap-2 border px-2.5 py-1.5 text-sm ${on ? "border-bronze bg-[#fbece2]" : "border-line bg-white"}`}
                      >
                        <span
                          className="h-4 w-4 border border-line"
                          style={{
                            background:
                              SWATCH[val] ??
                              "repeating-linear-gradient(45deg,#ddd,#ddd 3px,#fff 3px,#fff 6px)",
                          }}
                        />
                        {lab}
                      </button>
                    );
                  })}
                </div>
              </Labeled>
            );
          case "group":
            return (
              <fieldset
                key={f.name}
                className="space-y-4 border border-line p-3"
              >
                <legend className="px-1 text-sm font-semibold">
                  {f.label}
                </legend>
                <FieldList
                  fields={f.fields}
                  value={(v as Obj) ?? {}}
                  onChange={(x) => setV(x)}
                  ctx={ctx}
                  idPrefix={id}
                />
              </fieldset>
            );
          case "repeater":
            return (
              <Repeater
                key={f.name}
                spec={f}
                id={id}
                value={(v as Obj[]) ?? []}
                onChange={(x) => setV(x)}
                ctx={ctx}
              />
            );
          case "video": {
            const url = String(value.url ?? "");
            const fileUrl = String(value.fileUrl ?? "");
            return (
              <Labeled
                key={f.name}
                label={f.label}
                hint="Paste a YouTube or Vimeo link, or upload an MP4/MOV file."
                htmlFor={id}
              >
                <div className="space-y-2">
                  <input
                    id={id}
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={url}
                    onChange={(e) =>
                      onChange(withKey(value, "url", e.target.value))
                    }
                    className={INPUT}
                  />
                  {fileUrl ? (
                    <p className="text-sm">
                      Uploaded video: <code>{fileUrl.split("/").pop()}</code>{" "}
                      <button
                        type="button"
                        className="text-[#9b2c2c] underline"
                        onClick={() =>
                          onChange(withKey(value, "fileUrl", undefined))
                        }
                      >
                        remove
                      </button>
                    </p>
                  ) : null}
                  <UploadButton
                    accept="video/mp4,video/quicktime"
                    label="Upload a video"
                    onDone={(done) => {
                      const ok = done.find(
                        (d) => d.status === "done" && d.media,
                      );
                      if (ok?.media)
                        onChange(withKey(value, "fileUrl", ok.media.url));
                    }}
                  />
                </div>
              </Labeled>
            );
          }
          case "downloadFile": {
            const url = String(value.url ?? "");
            return (
              <Labeled
                key={f.name}
                label={f.label}
                hint="Upload a PDF or ZIP, or paste an https link."
                htmlFor={id}
              >
                <div className="space-y-2">
                  <input
                    id={id}
                    value={url}
                    placeholder="https://… or upload below"
                    onChange={(e) =>
                      onChange(withKey(value, "url", e.target.value))
                    }
                    className={INPUT}
                  />
                  <UploadButton
                    accept="application/pdf,application/zip"
                    label="Upload a file"
                    onDone={(done) => {
                      const ok = done.find(
                        (d) => d.status === "done" && d.media,
                      );
                      if (!ok?.media) return;
                      const m = ok.media as {
                        id: string;
                        url: string;
                        sizeBytes?: number;
                        name?: string;
                      };
                      onChange({
                        ...value,
                        mediaId: m.id,
                        url: m.url,
                        fileType: (m.url.split(".").pop() ?? "")
                          .toUpperCase()
                          .slice(0, 12),
                        sizeLabel: m.sizeBytes
                          ? sizeLabel(m.sizeBytes)
                          : undefined,
                      });
                    }}
                  />
                </div>
              </Labeled>
            );
          }
        }
      })}
    </div>
  );
}

function Repeater({
  spec,
  id,
  value,
  onChange,
  ctx,
}: {
  spec: Extract<FieldSpec, { kind: "repeater" }>;
  id: string;
  value: Obj[];
  onChange: (v: Obj[]) => void;
  ctx: BuilderCtx;
}) {
  // Rows are keyed by position, so after any reorder or removal the rows are rebuilt.
  const [version, setVersion] = useState(0);
  const bump = (next: Obj[]) => {
    setVersion((n) => n + 1);
    onChange(next);
  };
  const first = spec.fields[0];
  const isGallery = first?.kind === "image" && first.required;
  const max = spec.max ?? 50;

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const copy = [...value];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    bump(copy);
  };

  return (
    <Labeled label={spec.label} hint={spec.hint}>
      <div className="space-y-2">
        {value.map((row, i) => {
          const title = spec.titleField
            ? String(row[spec.titleField] ?? "")
                .replace(/<[^>]+>/g, "")
                .slice(0, 40)
            : "";
          return (
            <details
              key={`${version}-${i}`}
              className="border border-line bg-[#faf8f4]"
              open={value.length <= 3 || undefined}
            >
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm font-semibold">
                <span className="flex-1">
                  {spec.itemLabel} {i + 1}
                  {title ? (
                    <span className="font-normal text-stone"> — {title}</span>
                  ) : null}
                </span>
                <span
                  className="flex gap-1"
                  onClick={(e) => e.preventDefault()}
                >
                  <button
                    type="button"
                    aria-label="Move up"
                    className="h-8 w-8 border border-line bg-white"
                    onClick={() => move(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    className="h-8 w-8 border border-line bg-white"
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="h-8 border border-line bg-white px-2 text-[#9b2c2c]"
                    onClick={() => bump(value.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </button>
                </span>
              </summary>
              <div className="border-t border-line bg-white p-3">
                <FieldList
                  fields={spec.fields}
                  value={row}
                  onChange={(x) =>
                    onChange(value.map((r, idx) => (idx === i ? x : r)))
                  }
                  ctx={ctx}
                  idPrefix={`${id}-${i}`}
                />
              </div>
            </details>
          );
        })}
        <div className="flex flex-wrap gap-2">
          {value.length < max ? (
            <button
              type="button"
              onClick={() => bump([...value, {}])}
              className="border border-bronze-light px-3 py-1.5 text-sm text-bronze"
            >
              + Add {spec.itemLabel.toLowerCase()}
            </button>
          ) : null}
          {isGallery && value.length < max ? (
            <UploadButton
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              label="Upload several photos"
              onDone={async (done) => {
                const refs: Obj[] = [];
                for (const d of done) {
                  if (d.status !== "done" || !d.media) continue;
                  const ref = await getImageRef(d.media.id);
                  if (ref) refs.push({ image: ref });
                }
                if (refs.length) bump([...value, ...refs].slice(0, max));
              }}
            />
          ) : null}
        </div>
        {spec.min && value.length < spec.min ? (
          <p className="text-xs text-[#8a5a00]">Add at least {spec.min}.</p>
        ) : null}
      </div>
    </Labeled>
  );
}
