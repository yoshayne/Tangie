import Image from "next/image";
import { Fragment } from "react";
import {
  blurProps,
  focalToPosition,
  type ButtonRef,
  type ImageRef,
} from "@/lib/sections/types";
import { SectionButtons } from "./SectionButtons";

export type HeroSplitProps = {
  titleLine1: string;
  titleLine2: string;
  roleLine: string;
  body: string;
  buttons: ButtonRef[];
  image: ImageRef;
  imageSide?: "left" | "right";
};

export function HeroSplit({
  titleLine1,
  titleLine2,
  roleLine,
  body,
  buttons,
  image,
}: HeroSplitProps) {
  const roles = roleLine.split("|").map((r) => r.trim());
  return (
    <section className="relative bg-[linear-gradient(90deg,#d9ccbe_0%,#e6ddd3_20%,#ebe4dc_40%,#ece8e1_100%)] lg:h-[calc(var(--u)*680)]">
      <div className="relative aspect-[4/5] max-h-[560px] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:max-h-none lg:w-[calc(var(--gutter-x)+var(--u)*720)] lg:[mask-image:linear-gradient(to_right,transparent,#000_9%)]">
        <Image
          src={image.src}
          {...blurProps(image)}
          alt={image.alt}
          fill
          priority
          sizes="(min-width: 1024px) 53vw, 100vw"
          className="object-cover"
          style={{ objectPosition: focalToPosition(image.focal ?? [0.5, 0]) }}
        />
      </div>
      <div className="relative px-4 py-12 md:px-6 lg:flex lg:h-full lg:flex-col lg:justify-center lg:py-0 lg:pt-[calc(var(--u)*28)] lg:pl-[calc(var(--gutter-x)+var(--u)*109)] lg:pr-0">
        <h1 className="font-display font-normal uppercase text-heading">
          <span className="block text-hero1 tracking-[0.01em]">
            {titleLine1}
          </span>
          <span className="mt-[calc(var(--u)*4)] block text-hero2">
            {titleLine2}
          </span>
        </h1>
        <p className="mt-5 flex flex-wrap items-center gap-y-1 text-role font-medium uppercase tracking-[0.2em] lg:tracking-[0.36em] text-stone lg:mt-[calc(var(--u)*18)]">
          {roles.map((role, i) => (
            <Fragment key={role}>
              {i > 0 ? (
                <span
                  aria-hidden
                  className="mx-3 h-3 w-px bg-stone/70 lg:mx-[calc(var(--u)*22)] lg:h-[calc(var(--u)*17)]"
                />
              ) : null}
              <span>{role}</span>
            </Fragment>
          ))}
        </p>
        <p className="mt-8 max-w-[34rem] text-hero-body text-heading lg:mt-[calc(var(--u)*45)] lg:max-w-[calc(var(--u)*590)]">
          {body}
        </p>
        <SectionButtons
          buttons={buttons}
          className="mt-8 lg:mt-[calc(var(--u)*27)]"
        />
      </div>
    </section>
  );
}
