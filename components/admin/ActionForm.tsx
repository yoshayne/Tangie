"use client";

import { createContext, useActionState, useContext } from "react";
import type { AdminFormState } from "@/lib/admin/form";

type Ctx = {
  state: AdminFormState;
  defaults: Record<string, unknown>;
  pending: boolean;
};
const FormCtx = createContext<Ctx>({
  state: { status: "idle" },
  defaults: {},
  pending: false,
});
export const useAdminForm = () => useContext(FormCtx);

type Action = (
  prev: AdminFormState,
  formData: FormData,
) => Promise<AdminFormState>;

/**
 * Wraps a server action in a form that shows saving/errors, keeps what was typed after an error,
 * and hands default values and field errors to the field components inside it.
 */
export function ActionForm({
  action,
  defaults = {},
  submitLabel = "Save",
  children,
  footer,
}: {
  action: Action;
  defaults?: Record<string, unknown>;
  submitLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    action,
    { status: "idle" },
  );
  return (
    <FormCtx.Provider value={{ state, defaults, pending }}>
      <form action={formAction} noValidate className="space-y-6">
        {state.status === "error" ? (
          <div
            role="alert"
            className="border border-[#9b2c2c] bg-[#fdf1f1] px-4 py-3 text-sm text-[#9b2c2c]"
          >
            {state.message ?? "Something went wrong."}
          </div>
        ) : null}
        {state.status === "success" ? (
          <div
            role="status"
            className="border border-[#2f6b3a] bg-[#eff8f0] px-4 py-3 text-sm text-[#2f6b3a]"
          >
            {state.message ?? "Saved."}
          </div>
        ) : null}
        {children}
        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
          <button
            type="submit"
            disabled={pending}
            className="bg-bronze px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#815f36] disabled:opacity-60"
          >
            {pending ? "Saving…" : submitLabel}
          </button>
          {footer}
        </div>
      </form>
    </FormCtx.Provider>
  );
}
