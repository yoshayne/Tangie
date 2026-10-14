import type { z } from "zod";

/** The state every admin form action returns. */
export type AdminFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Record<string, string>;
  /** What was typed, so an error never wipes the form. */
  values?: Record<string, string>;
};

export function collectValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries())
    if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  return out;
}

export function fail(
  message: string,
  values?: Record<string, string>,
  errors?: Record<string, string>,
): AdminFormState {
  return { status: "error", message, values, errors };
}

/** Validates form values with zod; on failure returns a ready-to-send error state. */
export function parseForm<S extends z.ZodType>(
  schema: S,
  fd: FormData,
):
  | { ok: true; data: z.output<S>; values: Record<string, string> }
  | { ok: false; state: AdminFormState } {
  const values = collectValues(fd);
  const parsed = schema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data, values };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return {
    ok: false,
    state: {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors,
      values,
    },
  };
}

export { slugify } from "./slug";
