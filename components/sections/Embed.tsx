import { isAllowedEmbed } from "@/lib/video";
import type { Background, Spacing } from "@/lib/sections/types";
import { SectionShell } from "./SectionShell";

export type EmbedProps = {
  url: string;
  title: string;
  height?: number;
  background?: Background;
  spacing?: Spacing;
};

/** Embeds a page from an allowlisted site (YouTube, Vimeo, Eventbrite, Spotify, Google Maps). */
export function Embed({
  url,
  title,
  height = 480,
  background,
  spacing,
}: EmbedProps) {
  if (!isAllowedEmbed(url)) return null;
  return (
    <SectionShell background={background} spacing={spacing}>
      <iframe
        src={url}
        title={title}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ height }}
        className="mx-auto w-full lg:max-w-[calc(var(--u)*1100)] border-0"
      />
    </SectionShell>
  );
}
