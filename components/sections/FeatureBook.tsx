import Image from "next/image";
import { renderInline } from "@/lib/inline";
import {
  blurProps,
  imageStyle,
  type ButtonRef,
  type ImageRef,
} from "@/lib/sections/types";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionButtons } from "./SectionButtons";

export type FeatureBookProps = {
  eyebrow: string;
  heading: string;
  headingItalic?: boolean;
  body: string;
  buttons: ButtonRef[];
  image: ImageRef;
  /** "cover" for a full-bleed lifestyle photo, "contain" for a plain cover image */
  imageFit?: "cover" | "contain";
  imageSide?: "left" | "right";
};

export function FeatureBook({
  eyebrow,
  heading,
  headingItalic = true,
  body,
  buttons,
  image,
  imageFit = "cover",
}: FeatureBookProps) {
  return (
    <section className="grid bg-sand lg:h-[calc(var(--u)*484)] lg:grid-cols-[calc(var(--gutter-x)+var(--u)*779)_1fr]">
      <div className="relative min-h-[380px]">
        <div
          className={`absolute inset-x-0 overflow-hidden ${imageFit === "contain" ? "inset-y-8" : "inset-0"}`}
        >
          <Image
            src={image.src}
            {...blurProps(image)}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 54vw, 100vw"
            className={
              imageFit === "contain" ? "object-contain" : "object-cover"
            }
            style={imageStyle(image)}
          />
        </div>
      </div>
      <div className="flex flex-col justify-center px-4 py-14 md:px-6 lg:py-0 lg:pl-0 lg:pr-[calc(var(--u)*40)]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2
          className={`mt-[max(12px,calc(var(--u)*25))] font-display text-h2-feat font-normal text-heading ${headingItalic ? "italic" : ""}`}
        >
          {heading}
        </h2>
        <p className="mt-6 max-w-[34rem] text-body-feat text-copy-strong lg:mt-[calc(var(--u)*19)] lg:max-w-[calc(var(--u)*575)]">
          {renderInline(body)}
        </p>
        <SectionButtons
          buttons={buttons}
          className="mt-8 lg:mt-[calc(var(--u)*29)]"
        />
      </div>
    </section>
  );
}
