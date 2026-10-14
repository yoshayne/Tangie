"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions-auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );
  const input = "mt-1 w-full border border-line bg-white px-3 py-2.5";
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.email}
          required
          className={input}
        />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm text-[#9b2c2c]">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-bronze px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
