"use client";

import { useEffect, useRef, useState } from "react";
import {
  imageStyle,
  type ImageCrop,
  type ImageRef,
} from "@/lib/sections/types";

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

/**
 * "Adjust position and size": the photo sits in a frame shaped like the real slot on the page.
 * Drag it, use the sliders or arrow keys to move it, and zoom in or out. It is drawn with the
 * same helper the website uses, so what you see here is what the page shows.
 */
export function ImageAdjuster({
  value,
  aspects,
  onApply,
  onClose,
}: {
  value: ImageRef;
  aspects: Array<[label: string, ratio: number]>;
  onApply: (crop: ImageCrop) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(
    null,
  );
  const home: ImageCrop = {
    x: value.focal?.[0] ?? 0.5,
    y: value.focal?.[1] ?? 0.5,
    zoom: 1,
  };
  const [crop, setCrop] = useState<ImageCrop>(value.crop ?? home);
  const [shape, setShape] = useState(0);
  const [natural, setNatural] = useState<[number, number]>([
    value.width,
    value.height,
  ]);
  const ratio = aspects[shape]?.[1] ?? 1;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  /** How many pixels the photo overflows its frame (that is how far it can be moved). */
  function overflow(): [number, number] {
    const el = frame.current;
    const [w, h] = natural;
    if (!el || !w || !h) return [0, 0];
    const W = el.clientWidth;
    const H = el.clientHeight;
    const c = Math.max(W / w, H / h) * crop.zoom;
    return [Math.max(0, w * c - W), Math.max(0, h * c - H)];
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, x: crop.x, y: crop.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = start.current;
    if (!s) return;
    const [ox, oy] = overflow();
    setCrop((c) => ({
      ...c,
      x: ox > 0 ? clamp(s.x - (e.clientX - s.px) / ox) : c.x,
      y: oy > 0 ? clamp(s.y - (e.clientY - s.py) / oy) : c.y,
    }));
  }
  function onKey(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 0.1 : 0.02;
    const move: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (move[e.key]) {
      e.preventDefault();
      const [dx, dy] = move[e.key];
      setCrop((c) => ({ ...c, x: clamp(c.x + dx), y: clamp(c.y + dy) }));
    } else if (e.key === "+" || e.key === "=") zoomBy(0.1);
    else if (e.key === "-") zoomBy(-0.1);
  }
  const zoomBy = (d: number) =>
    setCrop((c) => ({
      ...c,
      zoom: Math.round(clamp(c.zoom + d, 1, 3) * 100) / 100,
    }));

  const slider = "w-full accent-[#b34815]";
  const btn =
    "border border-line bg-white px-3 py-1.5 text-sm hover:bg-[#f3efe8]";

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label="Adjust photo position and size"
      className="m-auto max-h-[94vh] w-[min(720px,96vw)] max-w-none overflow-y-auto border border-line bg-white p-0 backdrop:bg-black/60"
    >
      <div className="space-y-4 p-5">
        <div>
          <h2 className="font-display text-xl">Adjust position and size</h2>
          <p className="text-sm text-stone">
            Drag the photo to move it inside its frame, and zoom to make it
            bigger or smaller. Nothing is cropped automatically.
          </p>
        </div>

        {aspects.length > 1 ? (
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Frame shape"
          >
            {aspects.map(([label], i) => (
              <button
                key={label}
                type="button"
                aria-pressed={shape === i}
                onClick={() => setShape(i)}
                className={`border px-3 py-1.5 text-sm ${shape === i ? "border-bronze bg-[#fbece2]" : "border-line bg-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex justify-center bg-[#e4e0d8] p-3">
          <div
            ref={frame}
            tabIndex={0}
            role="img"
            aria-label="Photo frame. Drag, or use the arrow keys, to move the photo. Plus and minus zoom."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (start.current = null)}
            onPointerCancel={() => (start.current = null)}
            onKeyDown={onKey}
            className="relative cursor-grab touch-none overflow-hidden bg-sand outline-offset-2 active:cursor-grabbing"
            style={{
              aspectRatio: String(ratio),
              width: `min(100%, ${Math.round(340 * ratio)}px)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.src}
              alt=""
              draggable={false}
              onLoad={(e) =>
                setNatural([
                  e.currentTarget.naturalWidth,
                  e.currentTarget.naturalHeight,
                ])
              }
              className="absolute inset-0 h-full w-full select-none object-cover"
              style={imageStyle({ ...value, crop })}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(to right, transparent 33%, #fff 33%, #fff calc(33% + 1px), transparent calc(33% + 1px), transparent 66%, #fff 66%, #fff calc(66% + 1px), transparent calc(66% + 1px)), linear-gradient(to bottom, transparent 33%, #fff 33%, #fff calc(33% + 1px), transparent calc(33% + 1px), transparent 66%, #fff 66%, #fff calc(66% + 1px), transparent calc(66% + 1px))",
              }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Move left / right
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(crop.x * 100)}
              onChange={(e) =>
                setCrop({ ...crop, x: Number(e.target.value) / 100 })
              }
              className={slider}
            />
          </label>
          <label className="text-sm font-semibold">
            Move up / down
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(crop.y * 100)}
              onChange={(e) =>
                setCrop({ ...crop, y: Number(e.target.value) / 100 })
              }
              className={slider}
            />
          </label>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="zoom">
              Size (zoom): {Math.round(crop.zoom * 100)}%
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={btn}
                aria-label="Smaller"
                onClick={() => zoomBy(-0.1)}
              >
                −
              </button>
              <input
                id="zoom"
                type="range"
                min={100}
                max={300}
                step={5}
                value={Math.round(crop.zoom * 100)}
                onChange={(e) =>
                  setCrop({ ...crop, zoom: Number(e.target.value) / 100 })
                }
                className={slider}
              />
              <button
                type="button"
                className={btn}
                aria-label="Bigger"
                onClick={() => zoomBy(0.1)}
              >
                +
              </button>
            </div>
            <p className="mt-1 text-xs text-stone">
              100% fills the frame. Zooming in shows less of the photo, bigger.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
          <button type="button" className={btn} onClick={() => setCrop(home)}>
            Reset
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className={btn}
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-bronze px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-white"
              onClick={() => {
                onApply({
                  x: Math.round(crop.x * 1000) / 1000,
                  y: Math.round(crop.y * 1000) / 1000,
                  zoom: Math.round(crop.zoom * 100) / 100,
                });
                dialog.current?.close();
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
