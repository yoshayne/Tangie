import { Brevo, BrevoClient } from "@getbrevo/brevo";

/**
 * Brevo handles all email for the site: inquiry notifications, the auto-reply to the sender,
 * and the double opt-in newsletter signup. Nothing here throws when Brevo is not configured;
 * callers check `emailConfigured()` / `newsletterConfigured()` first.
 */

let client: BrevoClient | null | undefined;
function brevo(): BrevoClient | null {
  if (client === undefined) {
    const apiKey = process.env.BREVO_API_KEY;
    client = apiKey
      ? new BrevoClient({
          apiKey,
          timeoutInSeconds: 15,
          maxRetries: 2,
          // Only used by tests (a fake Brevo server); empty in production.
          ...(process.env.BREVO_BASE_URL
            ? { baseUrl: process.env.BREVO_BASE_URL }
            : {}),
        })
      : null;
  }
  return client;
}

const fromEmail = () => process.env.INQUIRY_FROM_EMAIL;
const fromName = () => process.env.INQUIRY_FROM_NAME || "TangieBeaty.com";
export const inquiryRecipient = () =>
  process.env.INQUIRY_TO_EMAIL || "tangiebeaty@gmail.com";

/** Can we send transactional email? Needs an API key and a sender address verified in Brevo. */
export function emailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && fromEmail());
}

/** Can we run the double opt-in newsletter? Needs the list and the confirmation-email template. */
export function newsletterConfigured(): boolean {
  return Boolean(
    process.env.BREVO_API_KEY &&
    process.env.BREVO_LIST_ID &&
    process.env.BREVO_DOI_TEMPLATE_ID,
  );
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: { email: string; name?: string };
}): Promise<void> {
  const c = brevo();
  if (!c || !fromEmail()) throw new Error("Email is not configured");
  await c.transactionalEmails.sendTransacEmail({
    sender: { name: fromName(), email: fromEmail()! },
    to: [{ email: opts.to }],
    subject: opts.subject,
    htmlContent: opts.html,
    textContent: opts.text,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  });
}

/**
 * Starts a double opt-in signup: Brevo emails the person a confirmation link and only adds them
 * to the list once they click it. Returns "already" if they are already subscribed.
 */
export async function startNewsletterSignup(
  email: string,
  redirectionUrl: string,
): Promise<"sent" | "already"> {
  const c = brevo();
  if (!c || !newsletterConfigured())
    throw new Error("Newsletter is not configured");
  try {
    await c.contacts.createDoiContact({
      email,
      includeListIds: [Number(process.env.BREVO_LIST_ID)],
      templateId: Number(process.env.BREVO_DOI_TEMPLATE_ID),
      redirectionUrl,
    });
    return "sent";
  } catch (e) {
    if (e instanceof Brevo.BadRequestError) {
      const body = JSON.stringify((e as { body?: unknown }).body ?? "");
      if (/already|duplicate/i.test(body)) return "already";
    }
    throw e;
  }
}
