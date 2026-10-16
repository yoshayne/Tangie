import Image from "next/image";
import {
  blurProps,
  imageStyle,
  type Background,
  type ImageRef,
  type Spacing,
} from "@/lib/sections/types";
import { SectionShell } from "./SectionShell";

export type QuoteProps = {
  quote: string;
  attribution?: string;
  portrait?: ImageRef;
  /** Handwritten script style for the quote. */
  script?: boolean;
  background?: Background;
  spacing?: Spacing;
};

export function Quote({
  quote,
  attribution,
  portrait,
  script = false,
  background = "sand",
  spacing,
}: QuoteProps) {
  const dark = background === "ink";
  return (
    <SectionShell background={background} spacing={spacing}>
      <figure className="mx-auto flex lg:max-w-[calc(var(--u)*1000)] flex-col items-center text-center">
        {portrait ? (
          <div className="relative mb-8 h-24 w-24 overflow-hidden lg:mb-[calc(var(--u)*36)] lg:h-[calc(var(--u)*112)] lg:w-[calc(var(--u)*112)]">
            <Image
              src={portrait.src}
              alt={portrait.alt}
              fill
              sizes="120px"
              {...blurProps(portrait)}
              className="object-cover"
              style={imageStyle(portrait)}
            />
          </div>
        ) : null}
        <span
          aria-hidden
          className="mb-6 block h-[var(--rule-h)] w-12 bg-gold lg:mb-[calc(var(--u)*28)]"
        />
        <blockquote
          className={`${script ? "font-script text-[32px] leading-[1.3] lg:text-[calc(var(--u)*52)]" : "font-display text-quote font-normal italic"} ${dark ? "text-ivory" : "text-heading"}`}
        >
          <p>&ldquo;{quote}&rdquo;</p>
        </blockquote>
        {attribution ? (
          <figcaption
            className={`mt-6 text-eyebrow font-semibold uppercase tracking-[0.18em] lg:mt-[calc(var(--u)*32)] ${dark ? "text-label-light" : "text-label-text"}`}
          >
            {attribution}
          </figcaption>
        ) : null}
      </figure>
    </SectionShell>
  );
}
