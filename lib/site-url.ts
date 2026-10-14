/** The public address of the site, used for share links, canonical URLs and structured data. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN)
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return "http://localhost:3000";
}

/**
 * True only on the real public address. Everything else (the Railway test address, local) tells
 * search engines to stay away. Read at run time on purpose, so changing the variable is enough.
 */
export function isProductionSite(): boolean {
  const v = process.env["NEXT_PUBLIC_SITE_URL"];
  return v?.replace(/\/$/, "") === "https://www.tangiebeaty.com";
}
