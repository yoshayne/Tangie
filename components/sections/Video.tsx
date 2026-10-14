import { parseVideoUrl } from "@/lib/video";
import {
  blurProps,
  type Background,
  type ImageRef,
  type Spacing,
} from "@/lib/sections/types";
import { SectionShell } from "./SectionShell";

export type VideoProps = {
  /** A YouTube or Vimeo link. */
  url?: string;
  /** Or an uploaded video file (served from /media). */
  fileUrl?: string;
  poster?: ImageRef;
  caption?: string;
  background?: Background;
  spacing?: Spacing;
};

export function Video({
  url,
  fileUrl,
  poster,
  caption,
  background,
  spacing,
}: VideoProps) {
  const parsed = url ? parseVideoUrl(url) : null;
  if (!parsed && !fileUrl) return null;
  return (
    <SectionShell background={background} spacing={spacing}>
      <figure className="mx-auto lg:max-w-[calc(var(--u)*1100)]">
        <div className="relative aspect-video w-full bg-ink">
          {parsed ? (
            <iframe
              src={parsed.embedUrl}
              title={caption ?? "Video"}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <video
              controls
              preload="none"
              poster={poster?.src}
              {...(poster
                ? { "data-blur": blurProps(poster).placeholder }
                : {})}
              className="absolute inset-0 h-full w-full"
            >
              <source src={fileUrl} />
            </video>
          )}
        </div>
        {caption ? (
          <figcaption className="mt-3 text-small text-stone">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </SectionShell>
  );
}
