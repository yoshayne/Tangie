import Image from "next/image";
import {
  blurProps,
  focalToPosition,
  type ImageRef,
} from "@/lib/sections/types";
import { SectionHeading } from "@/components/ui/SectionHeading";

export type PageHeroProps = {
  eyebrow?: string;
  heading: string;
  intro?: string;
  image?: ImageRef;
};

/** Top of every inner page. Renders the page's single <h1>. */
export function PageHero({ eyebrow, heading, intro, image }: PageHeroProps) {
  const dark = Boolean(image);
  return (
    <section
      className={`relative overflow-hidden ${dark ? "bg-ink text-ivory" : "bg-ivory"} pb-12 pt-16 lg:pb-[calc(var(--u)*72)] lg:pt-[calc(var(--u)*120)]`}
    >
      {image ? (
        <>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="100vw"
            {...blurProps(image)}
            className="object-cover opacity-45"
            style={{ objectPosition: focalToPosition(image.focal) }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
        </>
      ) : null}
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-6 lg:px-[calc(var(--u)*120)]">
        <SectionHeading
          eyebrow={eyebrow}
          heading={heading}
          size="page"
          level={1}
          onDark={dark}
        />
        {intro ? (
          <p
            className={`mt-6 lg:max-w-[calc(var(--u)*760)] text-lead lg:mt-[calc(var(--u)*28)] ${dark ? "text-ivory/90" : "text-copy"}`}
          >
            {intro}
          </p>
        ) : null}
      </div>
    </section>
  );
}
