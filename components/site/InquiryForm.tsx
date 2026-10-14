"use client";

import { useId, useState } from "react";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "select" | "textarea";
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  half?: boolean;
  autoComplete?: string;
};

type Errors = Record<string, string>;

const INPUT =
  "w-full border border-line bg-white px-4 text-[15px] text-charcoal placeholder:text-stone/70 min-h-12 lg:min-h-[calc(var(--u)*54)] lg:text-[calc(var(--u)*17)]";

/**
 * Inquiry form used by the contact and booking sections. It validates in the browser and has a
 * hidden spam-trap field. Sending (database, email, spam check) is wired in M5, so for now a valid
 * form says plainly that online sending is not switched on yet.
 */
export function InquiryForm({
  fields,
  submitLabel,
  formName,
}: {
  fields: FieldDef[];
  submitLabel: string;
  formName: string;
}) {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "unavailable">("idle");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Errors = {};
    for (const f of fields) {
      const value = String(data.get(f.name) ?? "").trim();
      if (f.required && !value) next[f.name] = `${f.label} is required.`;
      else if (f.type === "email" && value && !/^\S+@\S+\.\S+$/.test(value))
        next[f.name] = "Please enter a valid email address.";
    }
    setErrors(next);
    setStatus(Object.keys(next).length === 0 ? "unavailable" : "idle");
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={formName}
      className="grid gap-5 sm:grid-cols-2 lg:gap-[calc(var(--u)*24)]"
    >
      {/* Spam trap: real visitors never see or fill this. */}
      <div
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {fields.map((f) => {
        const fid = `${id}-${f.name}`;
        const err = errors[f.name];
        return (
          <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
            <label
              htmlFor={fid}
              className="mb-2 block text-small font-semibold text-heading"
            >
              {f.label}
              {f.required ? (
                <span className="text-bronze" aria-hidden>
                  {" "}
                  *
                </span>
              ) : null}
            </label>
            {f.type === "select" ? (
              <select
                id={fid}
                name={f.name}
                defaultValue={f.defaultValue ?? ""}
                required={f.required}
                aria-invalid={Boolean(err)}
                aria-describedby={err ? `${fid}-err` : undefined}
                className={INPUT}
              >
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                id={fid}
                name={f.name}
                rows={6}
                defaultValue={f.defaultValue}
                required={f.required}
                aria-invalid={Boolean(err)}
                aria-describedby={err ? `${fid}-err` : undefined}
                className={`${INPUT} py-3`}
              />
            ) : (
              <input
                id={fid}
                name={f.name}
                type={f.type}
                defaultValue={f.defaultValue}
                autoComplete={f.autoComplete}
                required={f.required}
                aria-invalid={Boolean(err)}
                aria-describedby={err ? `${fid}-err` : undefined}
                className={INPUT}
              />
            )}
            {err ? (
              <p id={`${fid}-err`} className="mt-1 text-small text-[#9b2c2c]">
                {err}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center bg-bronze px-10 text-btn font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-[#815f36] lg:h-[calc(var(--u)*57)] lg:px-[calc(var(--u)*44)]"
        >
          {submitLabel}
        </button>
        <p
          role="status"
          aria-live="polite"
          className="mt-4 min-h-6 text-small text-charcoal"
        >
          {status === "unavailable"
            ? "Thank you. Online sending is being switched on and isn't live yet, so this message was not sent. Please check back soon."
            : ""}
        </p>
      </div>
    </form>
  );
}
