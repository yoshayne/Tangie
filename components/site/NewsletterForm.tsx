"use client";

import { useId, useState } from "react";

// UI only in M2. M5 wires this to Turnstile, the database and Brevo double opt-in.
export function NewsletterForm({
  buttonLabel = "Subscribe",
  successMessage = "Check your inbox to confirm.",
}: {
  buttonLabel?: string;
  successMessage?: string;
}) {
  const id = useId();
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setStatus(/^\S+@\S+\.\S+$/.test(email) ? "success" : "error");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
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
          aria-invalid={status === "error"}
          aria-describedby={`${id}-status`}
          className="h-12 w-full min-w-0 border border-line bg-white px-4 text-[15px] text-charcoal placeholder:text-stone/80 sm:w-auto sm:flex-1 lg:h-[calc(var(--u)*54)] lg:px-[calc(var(--u)*22)] lg:text-[calc(var(--u)*17)]"
        />
        <button
          type="submit"
          className="h-12 bg-bronze px-8 text-btn font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-[#815f36] lg:h-[calc(var(--u)*54)] lg:w-[calc(var(--u)*180)] lg:px-0"
        >
          {buttonLabel}
        </button>
      </div>
      <p
        id={`${id}-status`}
        role="status"
        aria-live="polite"
        className={`mt-2 min-h-4 text-[13px] lg:mt-[calc(var(--u)*6)] ${status === "error" ? "text-[#9b2c2c]" : "text-charcoal"}`}
      >
        {status === "success"
          ? successMessage
          : status === "error"
            ? "Please enter a valid email address."
            : ""}
      </p>
    </form>
  );
}
