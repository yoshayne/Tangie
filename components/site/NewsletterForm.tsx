"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useActionState, useEffect, useId } from "react";
import { subscribeToNewsletter, type FormState } from "@/app/actions/forms";
import { track } from "@/lib/analytics";

/** Newsletter signup. The visitor gets a confirmation email from Brevo (double opt-in). */
export function NewsletterForm({
  buttonLabel = "Subscribe",
  successMessage = "Check your inbox to confirm.",
}: {
  buttonLabel?: string;
  successMessage?: string;
}) {
  const id = useId();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    subscribeToNewsletter,
    { status: "idle" },
  );
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (state.status === "success") track("newsletter_signup");
  }, [state]);

  const done = state.status === "success" || state.status === "pending";
  const error =
    state.errors?.email ??
    (state.status === "error" ? state.message : undefined);

  return (
    <form action={formAction} className="w-full" noValidate>
      <div
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {!done ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row lg:gap-[calc(var(--u)*10)]">
            <label htmlFor={id} className="sr-only">
              Your email address
            </label>
            <input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Your email address"
              defaultValue={state.values?.email}
              aria-invalid={Boolean(error)}
              aria-describedby={`${id}-status`}
              className="h-12 w-full min-w-0 border border-line bg-white px-4 text-[15px] text-charcoal placeholder:text-stone/80 sm:w-auto sm:flex-1 lg:h-[calc(var(--u)*54)] lg:px-[calc(var(--u)*22)] lg:text-[calc(var(--u)*17)]"
            />
            <button
              type="submit"
              disabled={pending}
              className="h-12 bg-bronze px-8 text-btn font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-[#815f36] disabled:opacity-60 lg:h-[calc(var(--u)*54)] lg:w-[calc(var(--u)*180)] lg:px-0"
            >
              {pending ? "…" : buttonLabel}
            </button>
          </div>
          {siteKey ? (
            <div className="mt-3">
              <Turnstile siteKey={siteKey} options={{ theme: "light" }} />
            </div>
          ) : null}
        </>
      ) : null}
      <p
        id={`${id}-status`}
        role={error ? "alert" : "status"}
        aria-live="polite"
        className={`mt-2 min-h-4 text-[13px] lg:mt-[calc(var(--u)*6)] ${error ? "text-[#9b2c2c]" : "text-charcoal"}`}
      >
        {state.status === "success"
          ? successMessage
          : state.status === "pending"
            ? state.message
            : (error ?? "")}
      </p>
    </form>
  );
}
