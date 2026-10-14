import { z } from "zod";

/** Reusable form-field parsers. Form values always arrive as strings. */
export const req = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`);

export const opt = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, "That is too long.")
    .optional()
    .transform((v) => (v ? v : null));

export const bool = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

export const int = (label: string, fallback = 0) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v.trim() === "") return fallback;
      const n = Number(v);
      if (!Number.isInteger(n)) {
        ctx.addIssue({
          code: "custom",
          message: `${label} must be a whole number.`,
        });
        return fallback;
      }
      return n;
    });

export const optInt = (label: string) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v.trim() === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n)) {
        ctx.addIssue({
          code: "custom",
          message: `${label} must be a whole number.`,
        });
        return null;
      }
      return n;
    });

export const uuidOrNull = z
  .string()
  .optional()
  .transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null));

export const url = (label: string, required = false) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) {
        if (required)
          ctx.addIssue({ code: "custom", message: `${label} is required.` });
        return null;
      }
      if (!/^https:\/\//i.test(v) && !v.startsWith("/")) {
        ctx.addIssue({
          code: "custom",
          message: `${label} must start with https:// (or / for a page on this site).`,
        });
      }
      return v;
    });

/** JSON array of rows coming from a RepeaterField. */
export function rows<T extends z.ZodType>(row: T) {
  return z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v) return [] as Array<z.output<T>>;
      try {
        const parsed = z.array(row).safeParse(JSON.parse(v));
        if (parsed.success) return parsed.data;
        ctx.addIssue({
          code: "custom",
          message: parsed.error.issues[0]?.message ?? "Check the list.",
        });
      } catch {
        ctx.addIssue({ code: "custom", message: "Check the list." });
      }
      return [] as Array<z.output<T>>;
    });
}

/** A date + time typed in New York time (datetime-local), turned into an exact moment. */
export function zonedToDate(value: string, timeZone: string): Date {
  const [d, t] = value.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = (t ?? "00:00").split(":").map(Number);
  // Find the UTC instant whose local time in `timeZone` equals the typed time.
  const guess = Date.UTC(y, m - 1, day, hh, mm);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(guess)).map((p) => [p.type, p.value]),
  );
  const asLocal = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );
  return new Date(guess - (asLocal - guess));
}

/** Date to the value a datetime-local input expects, in the given zone. */
export function dateToZonedInput(
  date: Date | null | undefined,
  timeZone: string,
): string {
  if (!date) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
