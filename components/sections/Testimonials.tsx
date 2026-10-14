import Image from "next/image";
import type { TestimonialData } from "@/lib/data/testimonials";
import {
  blurProps,
  imageStyle,
  type Background,
  type Spacing,
} from "@/lib/sections/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "./SectionShell";

export type TestimonialsProps = {
  eyebrow?: string;
  heading?: string;
  layout?: "grid" | "carousel";
  testimonials: TestimonialData[];
  background?: Background;
  spacing?: Spacing;
};

/** Shows approved testimonials. Renders nothing at all until some exist. */
export function Testimonials({
  eyebrow,
  heading,
  layout = "grid",
  testimonials,
  background,
  spacing,
}: TestimonialsProps) {
  if (testimonials.length === 0) return null;
  const dark = background === "ink";
  return (
    <SectionShell background={background} spacing={spacing}>
      {heading ? (
        <SectionHeading eyebrow={eyebrow} heading={heading} onDark={dark} />
      ) : null}
      <ul
        className={
          layout === "carousel"
            ? "mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 lg:mt-[calc(var(--u)*48)]"
            : "mt-10 grid gap-8 md:grid-cols-2 lg:mt-[calc(var(--u)*48)] lg:grid-cols-3 lg:gap-[calc(var(--u)*32)]"
        }
      >
        {testimonials.map((t) => (
          <li
            key={t.quote}
            className={
              layout === "carousel"
                ? "w-[85%] shrink-0 snap-start md:w-[45%]"
                : ""
            }
          >
            <figure
              className={`h-full border p-6 lg:p-[calc(var(--u)*36)] ${dark ? "border-bronze-light/40" : "border-line bg-white"}`}
            >
              <blockquote
                className={`font-display text-h3 font-normal italic ${dark ? "text-ivory" : "text-heading"}`}
              >
                <p>&ldquo;{t.quote}&rdquo;</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4">
                {t.portrait ? (
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden">
                    <Image
                      src={t.portrait.src}
                      alt={t.portrait.alt}
                      fill
                      sizes="48px"
                      {...blurProps(t.portrait)}
                      className="object-cover"
                      style={imageStyle(t.portrait)}
                    />
                  </span>
                ) : null}
                <span className="text-small">
                  <span className="block font-semibold">{t.name}</span>
                  {t.org ? (
                    <span className={dark ? "text-ivory/70" : "text-stone"}>
                      {t.org}
                    </span>
                  ) : null}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
