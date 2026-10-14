"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb, schema } from "@/lib/db";
import {
  emailConfigured,
  inquiryRecipient,
  newsletterConfigured,
  sendEmail,
  startNewsletterSignup,
} from "@/lib/email/brevo";
import { inquiryAutoReply, inquiryNotification } from "@/lib/email/templates";
import { rateLimit } from "@/lib/forms/rate-limit";
import {
  bookingSchema,
  contactSchema,
  fieldErrors,
  newsletterSchema,
} from "@/lib/forms/schemas";
import { verifyTurnstile } from "@/lib/forms/turnstile";
import { getSiteUrl } from "@/lib/site-url";

export type FormState = {
  status: "idle" | "success" | "error" | "unavailable" | "pending";
  message?: string;
  errors?: Record<string, string>;
  /** What the visitor typed, so an error never wipes their message. */
  values?: Record<string, string>;
  /** The inquiry type that was submitted (for analytics). */
  type?: string;
};

const NOT_LIVE =
  "Thank you. Online sending is being switched on and isn't live yet, so this was not sent. Please check back soon.";
const TOO_MANY =
  "That's a lot of attempts. Please wait a few minutes and try again.";
const HUMAN_CHECK =
  "We couldn't confirm you're human. Please wait a moment and try again.";
const GENERIC =
  "Something went wrong on our side. Please try again in a moment.";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

function collect(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (
      typeof v === "string" &&
      k !== "website" &&
      k !== "cf-turnstile-response" &&
      !k.startsWith("$ACTION")
    ) {
      values[k] = v;
    }
  }
  return values;
}

type Kind = "contact" | "booking";

async function handleInquiry(
  kind: Kind,
  formData: FormData,
): Promise<FormState> {
  const values = collect(formData);

  // Spam trap: bots fill the hidden field. Pretend it worked so they do not retry.
  if (String(formData.get("website") ?? "").trim() !== "")
    return { status: "success", message: "Thank you." };

  // Until email is switched on, nothing would reach Tangie, so do not accept the message.
  if (!emailConfigured())
    return { status: "unavailable", message: NOT_LIVE, values };

  const ip = await clientIp();
  if (!(await rateLimit(`rl:inquiry:${ip}`, 5, 600)))
    return { status: "error", message: TOO_MANY, values };
  if (
    !(await verifyTurnstile(
      String(formData.get("cf-turnstile-response") ?? "") || null,
      ip,
    ))
  ) {
    return { status: "error", message: HUMAN_CHECK, values };
  }

  const parsed = (kind === "contact" ? contactSchema : bookingSchema).safeParse(
    values,
  );
  if (!parsed.success)
    return { status: "error", errors: fieldErrors(parsed.error), values };

  // Normalise both forms into one shape.
  let row: typeof schema.inquiries.$inferInsert;
  let name: string;
  let email: string;
  let message: string;
  let type: string;
  let extraRows: Array<[string, string | undefined]>;

  if (kind === "contact") {
    const d = contactSchema.parse(values);
    name = `${d.firstName} ${d.lastName}`;
    email = d.email;
    type = d.type;
    message = d.message;
    row = {
      type,
      firstName: d.firstName,
      lastName: d.lastName,
      email,
      phone: d.phone,
      message,
    };
    extraRows = [
      ["Email", email],
      ["Phone", d.phone],
    ];
  } else {
    const d = bookingSchema.parse(values);
    name = d.name;
    email = d.email;
    type = "Booking / Speaking";
    message = d.eventType
      ? `Event type: ${d.eventType}\n\n${d.message}`
      : d.message;
    row = {
      type,
      firstName: d.name,
      email,
      phone: d.phone,
      organization: d.organization,
      eventDate: d.eventDate,
      eventLocation: d.location,
      audience: d.audience,
      attendance: d.attendance,
      budget: d.budget,
      message,
    };
    extraRows = [
      ["Email", email],
      ["Phone", d.phone],
      ["Organization", d.organization],
      ["Event type", d.eventType],
      ["Event date", d.eventDate],
      ["Location", d.location],
      ["Audience", d.audience],
      ["Estimated attendance", d.attendance],
      ["Budget", d.budget],
    ];
  }

  try {
    await getDb().insert(schema.inquiries).values(row);
  } catch (e) {
    console.error("Could not save inquiry:", e);
    return { status: "error", message: GENERIC, values };
  }

  // Email Tangie's team and auto-reply to the sender. The inquiry is already saved, so a failed
  // email is logged but the visitor still sees success.
  const note = inquiryNotification({
    type,
    name,
    rows: extraRows,
    message: kind === "contact" ? message : message,
  });
  const reply = inquiryAutoReply({ name });
  const results = await Promise.allSettled([
    sendEmail({
      to: inquiryRecipient(),
      subject: `[TangieBeaty.com] New ${type} inquiry from ${name}`,
      html: note.html,
      text: note.text,
      replyTo: { email, name },
    }),
    sendEmail({
      to: email,
      subject: reply.subject,
      html: reply.html,
      text: reply.text,
    }),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected")
      console.error(
        `Brevo email ${i === 0 ? "notification" : "auto-reply"} failed:`,
        r.reason,
      );
  });

  return {
    status: "success",
    type,
    message: "Thank you — Tangie's team will respond within 2–3 business days.",
  };
}

export async function submitContactForm(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return handleInquiry("contact", formData);
}

export async function submitBookingForm(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return handleInquiry("booking", formData);
}

export async function subscribeToNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = collect(formData);
  if (String(formData.get("website") ?? "").trim() !== "")
    return { status: "success", message: "Thank you." };

  const ip = await clientIp();
  if (!(await rateLimit(`rl:newsletter:${ip}`, 5, 600)))
    return { status: "error", message: TOO_MANY, values };
  if (
    !(await verifyTurnstile(
      String(formData.get("cf-turnstile-response") ?? "") || null,
      ip,
    ))
  ) {
    return { status: "error", message: HUMAN_CHECK, values };
  }

  const parsed = newsletterSchema.safeParse(values);
  if (!parsed.success)
    return { status: "error", errors: fieldErrors(parsed.error), values };
  const email = parsed.data.email.toLowerCase();

  try {
    await getDb()
      .insert(schema.subscribers)
      .values({ email, source: values.source || "website" })
      .onConflictDoNothing();
  } catch (e) {
    console.error("Could not save subscriber:", e);
    return { status: "error", message: GENERIC, values };
  }

  if (!newsletterConfigured()) {
    return {
      status: "pending",
      message:
        "Thank you. Your signup is saved, but confirmation emails aren't switched on yet.",
    };
  }

  try {
    await startNewsletterSignup(email, `${getSiteUrl()}/newsletter-confirmed`);
    await getDb()
      .update(schema.subscribers)
      .set({ brevoSynced: true })
      .where(eq(schema.subscribers.email, email));
    return { status: "success", type: "newsletter" };
  } catch (e) {
    console.error("Brevo signup failed:", e);
    return { status: "error", message: GENERIC, values };
  }
}
