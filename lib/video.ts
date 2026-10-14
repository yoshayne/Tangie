/** Turns a YouTube or Vimeo link into a safe embed URL. Anything else returns null. */
export function parseVideoUrl(
  raw: string,
): { provider: "youtube" | "vimeo"; embedUrl: string } | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id && /^[\w-]{6,20}$/.test(id)
      ? {
          provider: "youtube",
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        }
      : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = u.pathname.startsWith("/embed/")
      ? u.pathname.split("/")[2]
      : u.searchParams.get("v");
    return id && /^[\w-]{6,20}$/.test(id)
      ? {
          provider: "youtube",
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        }
      : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean).pop();
    return id && /^\d{5,12}$/.test(id)
      ? {
          provider: "vimeo",
          embedUrl: `https://player.vimeo.com/video/${id}?dnt=1`,
        }
      : null;
  }
  return null;
}

const EMBED_HOSTS = new Set([
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "www.eventbrite.com",
  "eventbrite.com",
  "open.spotify.com",
  "www.google.com",
  "maps.google.com",
]);

/** Only these sites may be embedded with the `embed` section (CLAUDE.md §6B). */
export function isAllowedEmbed(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !EMBED_HOSTS.has(u.hostname)) return false;
    if (u.hostname === "www.google.com")
      return u.pathname.startsWith("/maps/embed");
    return true;
  } catch {
    return false;
  }
}
