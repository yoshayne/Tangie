import Image from "next/image";
import { renderInline } from "@/lib/inline";
import {
  blurProps,
  focalToPosition,
  type ButtonRef,
  type ImageRef,
} from "@/lib/sections/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionButtons } from "./SectionButtons";

export type DarkFeatureProps = {
  eyebrow: string;
  heading: string;
  body: string;
  buttons: ButtonRef[];
  image?: ImageRef;
};

export function DarkFeature({
  eyebrow,
  heading,
  body,
  buttons,
  image,
}: DarkFeatureProps) {
  return (
    <section className="relative overflow-hidden bg-ink text-ivory lg:h-[calc(var(--u)*412)]">
      {image ? (
        <div className="absolute inset-y-0 right-0 hidden w-[calc(var(--gutter-x)+var(--u)*900)] lg:block">
          <Image
            src={image.src}
            {...blurProps(image)}
            alt={image.alt}
            fill
            sizes="62vw"
            className="object-cover"
            style={{ objectPosition: focalToPosition(image.focal) }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink from-[2%] via-ink/70 via-[28%] to-transparent to-[75%]" />
        </div>
      ) : null}
      {image ? (
        <div className="relative aspect-[16/9] w-full lg:hidden">
          <Image
            src={image.src}
            {...blurProps(image)}
            alt={image.alt}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: focalToPosition(image.focal) }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
        </div>
      ) : null}
      <div className="relative px-4 py-12 md:px-6 lg:flex lg:h-full lg:flex-col lg:justify-center lg:py-0 lg:pt-[calc(var(--u)*22)] lg:pl-[calc(var(--gutter-x)+var(--u)*108)] lg:pr-0">
        <SectionHeading eyebrow={eyebrow} heading={heading} onDark />
        <p className="mt-5 max-w-[34rem] text-body text-ivory/95 lg:mt-[calc(var(--u)*14)] lg:max-w-[calc(var(--u)*660)]">
          {renderInline(body)}
        </p>
        <SectionButtons
          buttons={buttons}
          className="mt-7 lg:mt-[calc(var(--u)*28)]"
        />
      </div>
    </section>
  );
}
