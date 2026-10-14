/** Is Cloudflare Turnstile switched on? (Both keys are needed.) */
export function turnstileEnabled(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

/** Verifies the token the Turnstile widget put in the form. Always true while Turnstile is off. */
export async function verifyTurnstile(
  token: string | null,
  ip: string,
): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY!,
          response: token,
          ...(ip !== "unknown" ? { remoteip: ip } : {}),
        }),
        signal: AbortSignal.timeout(8000),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("Turnstile verification failed:", (e as Error).message);
    return false;
  }
}
