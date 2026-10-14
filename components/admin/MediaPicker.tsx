"use client";

import { useEffect, useRef, useState } from "react";
import { saveMediaMeta } from "@/app/admin/actions-media";
import { uploadFiles, type UploadState } from "@/lib/admin/client-upload";

type Item = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  usageCount: number;
};

async function fetchItems(query: string): Promise<Item[]> {
  const res = await fetch(
    `/api/admin/media?kind=image&limit=60${query ? `&q=${encodeURIComponent(query)}` : ""}`,
  );
  return res.ok ? ((await res.json()) as Item[]) : [];
}

export type PickedMedia = { id: string; url: string; alt: string };

/** Modal for choosing a photo: pick from the library or upload new ones. Alt text is required. */
export function MediaPicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (m: PickedMedia) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [chosen, setChosen] = useState<Item | null>(null);
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
    void fetchItems("").then(setItems);
  }, []);

  async function onFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    const done = await uploadFiles(list, setUploads);
    setItems(await fetchItems(q));
    const first = done.find((d) => d.status === "done" && d.media);
    if (first?.media) {
      setChosen({
        id: first.media.id,
        url: first.media.url,
        alt: first.media.alt ?? "",
        width: null,
        height: null,
        usageCount: 0,
      });
      setAlt(first.media.alt ?? "");
    }
  }

  async function confirm() {
    if (!chosen) return;
    if (!alt.trim()) {
      setError(
        "Please describe the photo in a few words (this helps people using screen readers and search engines).",
      );
      return;
    }
    if (alt.trim() !== chosen.alt) {
      const res = await saveMediaMeta(chosen.id, {
        alt,
        caption: "",
        focalX: 0.5,
        focalY: 0.5,
      });
      if (!res.ok) return setError(res.error ?? "Could not save.");
    }
    onPick({ id: chosen.id, url: chosen.url, alt: alt.trim() });
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label="Choose a photo"
      className="m-auto h-[88vh] w-[min(980px,96vw)] max-w-none border border-line bg-white p-0 backdrop:bg-black/60"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <h2 className="font-display text-xl">Choose a photo</h2>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              void fetchItems(e.target.value).then(setItems);
            }}
            placeholder="Search by description or file name"
            className="min-w-[12rem] flex-1 border border-line px-3 py-2"
            aria-label="Search photos"
          />
          <label className="cursor-pointer bg-bronze px-4 py-2 text-sm font-semibold text-white">
            Upload new
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="sr-only"
              onChange={(e) => e.target.files && void onFiles(e.target.files)}
            />
          </label>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="border border-line px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>

        {uploads.length > 0 ? (
          <ul className="space-y-1 border-b border-line bg-[#faf8f4] p-3 text-sm">
            {uploads.map((u) => (
              <li key={u.id}>
                {u.name}:{" "}
                {u.status === "uploading" ? (
                  `${u.progress}%`
                ) : u.status === "done" ? (
                  u.duplicate ? (
                    "already in your library"
                  ) : (
                    "uploaded"
                  )
                ) : (
                  <span className="text-[#9b2c2c]">{u.error}</span>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        <div
          className="min-h-0 flex-1 overflow-y-auto p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFiles(e.dataTransfer.files);
          }}
        >
          {items.length === 0 ? (
            <p className="py-12 text-center text-stone">
              No photos yet. Upload one, or drag files here.
            </p>
          ) : null}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setChosen(m);
                    setAlt(m.alt);
                    setError("");
                  }}
                  className={`block w-full border-2 text-left ${chosen?.id === m.id ? "border-bronze" : "border-transparent hover:border-line"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={m.alt}
                    loading="lazy"
                    className="aspect-square w-full bg-sand object-cover"
                  />
                  {!m.alt ? (
                    <span className="block bg-[#fff6e5] px-1 py-0.5 text-[11px] text-[#8a5a00]">
                      No description
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {chosen ? (
          <div className="flex flex-wrap items-end gap-3 border-t border-line bg-[#faf8f4] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={chosen.url} alt="" className="h-16 w-16 object-cover" />
            <label className="min-w-[14rem] flex-1 text-sm font-semibold">
              Describe this photo <span className="text-bronze">*</span>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="mt-1 w-full border border-line px-3 py-2 font-normal"
                placeholder="e.g. Tangie smiling at her laptop"
              />
            </label>
            <button
              type="button"
              onClick={() => void confirm()}
              className="bg-bronze px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-white"
            >
              Use this photo
            </button>
            {error ? (
              <p role="alert" className="w-full text-sm text-[#9b2c2c]">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
