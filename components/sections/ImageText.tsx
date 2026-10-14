import Image from "next/image";
import { cn } from "@/lib/cn";
import { renderInline } from "@/lib/inline";
import {
  focalToPosition,
  type ButtonRef,
  type ImageRef,
} from "@/lib/sections/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionButtons } from "./SectionButtons";

export type ImageTextProps = {
  eyebrow: string;
  heading: string;
  body: string;
  buttons: ButtonRef[];
  image: ImageRef;
  imageSide?: "left" | "right";
  imageStyle?: "framed" | "bleed";
};

export function ImageText({
  eyebrow,
  heading,
  body,
  buttons,
  image,
  imageSide = "left",
  imageStyle = "framed",
}: ImageTextProps) {
  const imageRight = imageSide === "right";
  const text = (
    <div className="flex flex-col justify-center lg:pt-[calc(var(--u)*22)]">
      <SectionHeading eyebrow={eyebrow} heading={heading} />
      <p className="mt-5 max-w-[34rem] text-body text-copy lg:mt-[calc(var(--u)*13)] lg:max-w-[calc(var(--u)*640)]">
        {renderInline(body)}
      </p>
      <SectionButtons
        buttons={buttons}
        className="mt-7 lg:mt-[calc(var(--u)*28)]"
      />
    </div>
  );

  if (imageStyle === "bleed") {
    return (
      <section className="grid bg-ivory lg:h-[calc(var(--u)*357)] lg:grid-cols-[calc(var(--gutter-x)+var(--u)*646)_1fr] lg:pt-[calc(var(--u)*9)]">
        <div
          className={cn(
            "relative aspect-[16/10] lg:aspect-auto",
            imageRight && "lg:order-2",
          )}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
            style={{ objectPosition: focalToPosition(image.focal) }}
          />
        </div>
        <div className="flex px-4 py-12 md:px-6 lg:items-center lg:py-0 lg:pb-[calc(var(--u)*9)] lg:pl-[calc(var(--u)*76)] lg:pr-6">
          {text}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ivory px-4 py-12 md:px-6 lg:flex lg:h-[calc(var(--u)*432)] lg:items-center lg:py-0">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-8 lg:grid-cols-[calc(var(--u)*445)_1fr] lg:gap-[calc(var(--u)*100)] lg:pl-[calc(var(--u)*150)]">
        <div
          className={cn(
            "relative aspect-[4/3.5] w-full max-w-[560px] overflow-hidden lg:max-w-none lg:aspect-auto lg:h-[calc(var(--u)*393)]",
            imageRight && "lg:order-2",
          )}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 31vw, 100vw"
            className="object-cover"
            style={{ objectPosition: focalToPosition(image.focal) }}
          />
        </div>
        {text}
      </div>
    </section>
  );
}
