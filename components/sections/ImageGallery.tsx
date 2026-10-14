"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  blurProps,
  imageStyle,
  type Background,
  type ImageRef,
  type Spacing,
} from "@/lib/sections/types";
import { SectionShell } from "./SectionShell";

export type ImageGalleryProps = {
  items: Array<{ image: ImageRef; caption?: string }>;
  columns?: 2 | 3 | 4;
  layout?: "grid" | "masonry";
  background?: Background;
  spacing?: Spacing;
};

const COLS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};
const MASONRY = {
  2: "sm:columns-2",
  3: "sm:columns-2 lg:columns-3",
  4: "sm:columns-2 lg:columns-4",
};

/** Photo grid with a keyboard-friendly lightbox (native <dialog>: Esc closes, focus is trapped for us). */
export function ImageGallery({
  items,
  columns = 3,
  layout = "grid",
  background,
  spacing,
}: ImageGalleryProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const current = items[index];

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = (d: number) =>
    setIndex((i) => (i + d + items.length) % items.length);

  return (
    <SectionShell background={background} spacing={spacing}>
      <ul
        className={
          layout === "masonry"
            ? `${MASONRY[columns]} gap-4 lg:gap-[calc(var(--u)*24)]`
            : `grid gap-4 ${COLS[columns]} lg:gap-[calc(var(--u)*24)]`
        }
      >
        {items.map((item, i) => (
          <li
            key={i}
            className={
              layout === "masonry"
                ? "mb-4 break-inside-avoid lg:mb-[calc(var(--u)*24)]"
                : ""
            }
          >
            <button
              type="button"
              onClick={() => open(i)}
              className="group block w-full text-left"
              aria-label={`Open photo ${i + 1} of ${items.length}${item.caption ? `: ${item.caption}` : ""}`}
            >
              <div
                className={`relative w-full overflow-hidden bg-sand ${layout === "grid" ? "aspect-[4/3]" : ""}`}
              >
                {layout === "masonry" ? (
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    width={item.image.width}
                    height={item.image.height}
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    {...blurProps(item.image)}
                    className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    {...blurProps(item.image)}
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    style={imageStyle(item.image)}
                  />
                )}
              </div>
              {item.caption ? (
                <p className="mt-2 text-small text-stone">{item.caption}</p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label="Photo viewer"
        className="m-auto h-[90vh] w-[94vw] max-w-none bg-ink p-0 text-ivory backdrop:bg-black/85"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        {current ? (
          <div className="relative flex h-full flex-col">
            <div className="relative min-h-0 flex-1">
              <Image
                src={current.image.src}
                alt={current.image.alt}
                fill
                sizes="94vw"
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <p className="min-w-0 truncate">
                {current.caption ?? current.image.alt}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                {items.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      className="h-11 w-11 hover:text-bronze-light"
                      aria-label="Previous photo"
                    >
                      ←
                    </button>
                    <span aria-live="polite" className="text-ivory/70">
                      {index + 1} / {items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      className="h-11 w-11 hover:text-bronze-light"
                      aria-label="Next photo"
                    >
                      →
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => dialog.current?.close()}
                  className="ml-2 h-11 px-3 hover:text-bronze-light"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </SectionShell>
  );
}
