import {
  siFacebook,
  siInstagram,
  siTiktok,
  siX,
  siYoutube,
} from "simple-icons";
import type { SocialKey } from "@/lib/site-data";

// simple-icons no longer ships LinkedIn, so its path is inlined.
const LINKEDIN_PATH =
  "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z";

const PATHS: Record<SocialKey, string> = {
  facebook: siFacebook.path,
  instagram: siInstagram.path,
  youtube: siYoutube.path,
  tiktok: siTiktok.path,
  linkedin: LINKEDIN_PATH,
  x: siX.path,
};

export function SocialIcon({ name }: { name: SocialKey }) {
  return (
    <svg
      viewBox={name === "linkedin" ? "2.5 2.5 19 19" : "0 0 24 24"}
      width={21}
      height={21}
      fill="currentColor"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
