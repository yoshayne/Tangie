import Image from "next/image";
import {
  blurProps,
  type Background,
  type ImageRef,
  type Spacing,
} from "@/lib/sections/types";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionShell } from "./SectionShell";

export type LogoStripProps = {
  heading?: string;
  items: Array<{ name: string; href?: string; image?: ImageRef }>;
  background?: Background;
  spacing?: Spacing;
};

export function LogoStrip({
  heading,
  items,
  background = "ivory-deep",
  spacing = "compact",
}: LogoStripProps) {
  const dark = background === "ink";
  return (
    <SectionShell background={background} spacing={spacing}>
      {heading ? (
        <Eyebrow
          onDark={dark}
          className="mb-8 text-center lg:mb-[calc(var(--u)*36)]"
        >
          {heading}
        </Eyebrow>
      ) : null}
      <ul className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 lg:gap-x-[calc(var(--u)*80)]">
        {items.map((item) => {
          const inner = item.image ? (
            <Image
              src={item.image.src}
              alt={item.image.alt || item.name}
              width={item.image.width}
              height={item.image.height}
              {...blurProps(item.image)}
              className="h-12 w-auto object-contain lg:h-[calc(var(--u)*56)]"
            />
          ) : (
            <span
              className={`font-display text-h3 font-normal ${dark ? "text-ivory" : "text-heading"}`}
            >
              {item.name}
            </span>
          );
          return (
            <li key={item.name}>
              {item.href ? (
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    item.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="block opacity-90 transition-opacity duration-200 hover:opacity-100"
                  aria-label={item.name}
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}
