"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useActionState, useEffect, useId } from "react";
import type { FormState } from "@/app/actions/forms";
import { track } from "@/lib/analytics";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "select" | "textarea";
  required?: boolean;
  options?: readonly string[];
  defaultValue?: string;
  half?: boolean;
  autoComplete?: string;
};

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const INPUT =
  "w-full border border-line bg-white px-4 text-[15px] text-charcoal placeholder:text-stone/70 min-h-12 lg:min-h-[calc(var(--u)*54)] lg:text-[calc(var(--u)*17)]";

/**
 * Shared by the contact and booking sections. The server action validates, saves the inquiry and
 * emails Tangie's team through Brevo. A hidden trap field and (when its keys exist) Cloudflare
 * Turnstile keep bots out.
 */
export function InquiryForm({
  fields,
  submitLabel,
  formName,
  action,
}: {
  fields: FieldDef[];
  submitLabel: string;
  formName: string;
  action: Action;
}) {
  const id = useId();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    { status: "idle" },
  );
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (state.status === "success")
      track("inquiry_submit", { type: state.type ?? formName });
  }, [state, formName]);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="border border-bronze-light bg-white p-8 lg:p-[calc(var(--u)*48)]"
      >
        <p className="font-display text-h3 font-normal text-heading">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
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
        const err = state.errors?.[f.name];
        const value = state.values?.[f.name] ?? f.defaultValue;
        const common = {
          id: fid,
          name: f.name,
          required: f.required,
          "aria-invalid": Boolean(err),
          "aria-describedby": err ? `${fid}-err` : undefined,
        } as const;
        return (
          <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
            <label
              htmlFor={fid}
              className="mb-2 block text-small font-semibold text-heading"
            >
              {f.label}
              {f.required ? (
                <span className="text-bronze-text" aria-hidden>
                  {" "}
                  *
                </span>
              ) : null}
            </label>
            {f.type === "select" ? (
              <select {...common} defaultValue={value ?? ""} className={INPUT}>
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                {...common}
                rows={6}
                defaultValue={value}
                className={`${INPUT} py-3`}
              />
            ) : (
              <input
                {...common}
                type={f.type}
                defaultValue={value}
                autoComplete={f.autoComplete}
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

      {siteKey ? (
        <div className="sm:col-span-2">
          <Turnstile siteKey={siteKey} options={{ theme: "light" }} />
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center bg-bronze px-10 text-btn font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-accent-hover disabled:opacity-60 lg:h-[calc(var(--u)*57)] lg:px-[calc(var(--u)*44)]"
        >
          {pending ? "Sending…" : submitLabel}
        </button>
        <p
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`mt-4 min-h-6 text-small ${state.status === "error" ? "text-[#9b2c2c]" : "text-charcoal"}`}
        >
          {state.status === "error" || state.status === "unavailable"
            ? (state.message ??
              (state.errors ? "Please fix the highlighted fields." : ""))
            : ""}
        </p>
      </div>
    </form>
  );
}
