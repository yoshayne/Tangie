import { z } from "zod";

export const INQUIRY_TYPES = [
  "General",
  "Booking / Speaking",
  "Media / Press",
  "Books / Book Club",
  "Collaboration",
] as const;
export const EVENT_TYPES = [
  "Author talk",
  "Book club",
  "Faith-based women's event",
  "Teen & youth",
  "Creative leadership",
  "Panel or conference",
  "Workshop",
  "Other",
] as const;
// TODO(client): confirm the budget ranges before launch.
export const BUDGETS = [
  "Under $1,000",
  "$1,000 – $2,500",
  "$2,500 – $5,000",
  "$5,000+",
  "Not sure yet",
] as const;

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`);
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "That is too long.")
    .optional()
    .transform((v) => (v ? v : undefined));
const email = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.")
  .max(200);

export const contactSchema = z.object({
  firstName: text("First name", 80),
  lastName: text("Last name", 80),
  email,
  phone: optional(40),
  type: z.enum(INQUIRY_TYPES, { message: "Please choose an inquiry type." }),
  message: text("Message", 5000),
});

export const bookingSchema = z.object({
  name: text("Your name", 120),
  email,
  phone: optional(40),
  organization: optional(160),
  eventType: z
    .enum(EVENT_TYPES)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  eventDate: optional(20),
  location: optional(200),
  audience: optional(200),
  attendance: optional(60),
  budget: z
    .enum(BUDGETS)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  message: text("Your message", 5000),
});

export const newsletterSchema = z.object({ email });

/** Turns zod issues into { fieldName: first message }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
