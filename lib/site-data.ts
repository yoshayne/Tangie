// Hard-coded for M2. In M3 this moves into the database (nav_items + site_settings).

export type NavItem = { label: string; href: string };

export const HEADER_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Books", href: "/books" },
  { label: "Film & Theater", href: "/film-theater" },
  { label: "Speaking", href: "/speaking" },
  { label: "Events", href: "/events" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

export const FOOTER_NAV: NavItem[] = [
  ...HEADER_NAV,
  { label: "Contact", href: "/contact" },
];

export type SocialKey =
  "facebook" | "instagram" | "youtube" | "tiktok" | "linkedin" | "x";

export const SOCIAL_LINKS: Array<{
  key: SocialKey;
  label: string;
  href: string | null;
}> = [
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/tangiebeaty",
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/tangiebeatywrites",
  },
  // TODO(client): YouTube URL (shown in the mockup, not on the current site). Hidden until supplied.
  { key: "youtube", label: "YouTube", href: null },
  {
    key: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@tangiebrickhousebeaty",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/tangiebeaty/",
  },
  // TODO(client): keep or drop X (the mockup drops it). Hidden by default.
];

export const AFFILIATES = [
  { label: "WOW Studio One", href: "https://www.wowstudioone.com" },
  { label: "Destined 2 WOW Foundation", href: "https://www.wow-pac.org" },
];

export type SocialLink = {
  key: SocialKey;
  label: string;
  href: string | null;
};

/** Used as the instant fallback while the database copy loads, and by the seed. */
export const DEFAULT_CHROME = {
  headerNav: HEADER_NAV,
  headerCta: { label: "Contact", href: "/contact" } as NavItem | null,
  footerNav: FOOTER_NAV,
  social: SOCIAL_LINKS as SocialLink[],
  affiliates: AFFILIATES,
  announcement: null as { text: string; link: string } | null,
  motion: { enabled: true, level: "bold" as "gentle" | "bold" },
  tagline: "Real Stories. Lasting Impact.",
  theme: "studio" as "studio" | "royal" | "teal" | "classic",
};
