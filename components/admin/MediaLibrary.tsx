"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  deleteMedia,
  loadMediaDetail,
  saveMediaMeta,
  type MediaDetail,
} from "@/app/admin/actions-media";
import { uploadFiles, type UploadState } from "@/lib/admin/client-upload";
import { Badge } from "./ui";

type Item = {
  id: string;
  kind: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string | null;
  createdAt: string;
  usageCount: number;
};

const size = (n: number) =>
  n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

export function MediaLibrary({ items }: { items: Item[] }) {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    await uploadFiles(list, setUploads);
    router.refresh();
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void onFiles(e.dataTransfer.files);
        }}
        className={`mb-6 border-2 border-dashed p-6 text-center ${drag ? "border-bronze bg-[#faf3e8]" : "border-line bg-white"}`}
      >
        <p className="text-stone">Drag photos here, or</p>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="mt-2 bg-bronze px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-white"
        >
          Upload files
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/quicktime,application/pdf,application/zip"
          className="sr-only"
          onChange={(e) => e.target.files && void onFiles(e.target.files)}
        />
        <p className="mt-2 text-xs text-stone">
          Photos up to 25 MB (JPG, PNG, WebP, AVIF) · Video up to 500 MB (MP4,
          MOV) · PDF or ZIP up to 50 MB
        </p>
        {uploads.length > 0 ? (
          <ul className="mx-auto mt-4 max-w-xl space-y-2 text-left text-sm">
            {uploads.map((u) => (
              <li key={u.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{u.name}</span>
                  <span className="shrink-0">
                    {u.status === "uploading" ? (
                      <button
                        type="button"
                        onClick={() => u.cancel?.()}
                        className="text-[#9b2c2c] underline"
                      >
                        Cancel
                      </button>
                    ) : u.status === "done" ? (
                      <span className="text-[#2f6b3a]">
                        {u.duplicate ? "Already in your library" : "Uploaded"}
                      </span>
                    ) : (
                      <span className="text-[#9b2c2c]">{u.error}</span>
                    )}
                  </span>
                </div>
                {u.status === "uploading" ? (
                  <div className="mt-1 h-1.5 bg-[#efece6]">
                    <div
                      className="h-full bg-bronze"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="border border-dashed border-line bg-white px-6 py-12 text-center text-stone">
          Nothing here yet.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={async () => setDetail(await loadMediaDetail(m.id))}
                className="block w-full border border-line bg-white text-left hover:border-bronze"
              >
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.alt}
                    loading="lazy"
                    className="aspect-square w-full bg-sand object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-[#efece6] text-sm font-semibold uppercase tracking-[0.14em] text-stone">
                    {m.kind}
                  </div>
                )}
                <div className="space-y-1 p-2 text-xs">
                  <p className="truncate font-semibold">
                    {m.originalFilename ?? m.url.split("/").pop()}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {m.kind === "image" && !m.alt ? (
                      <Badge tone="warn">No description</Badge>
                    ) : null}
                    {m.usageCount === 0 ? (
                      <Badge>Unused</Badge>
                    ) : (
                      <Badge tone="good">Used {m.usageCount}×</Badge>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {detail ? (
        <Drawer
          key={detail.id}
          detail={detail}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </div>
  );
}

function Drawer({
  detail,
  onClose,
}: {
  detail: MediaDetail;
  onClose: () => void;
}) {
  const router = useRouter();
  const [alt, setAlt] = useState(detail.alt);
  const [caption, setCaption] = useState(detail.caption);
  const [focal, setFocal] = useState<[number, number]>([
    detail.focalX,
    detail.focalY,
  ]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const isImage = detail.kind === "image";
  const pos = `${Math.round(focal[0] * 100)}% ${Math.round(focal[1] * 100)}%`;

  const save = () =>
    start(async () => {
      const r = await saveMediaMeta(detail.id, {
        alt,
        caption,
        focalX: focal[0],
        focalY: focal[1],
      });
      setMsg({
        ok: r.ok,
        text: r.ok ? "Saved." : (r.error ?? "Could not save."),
      });
      if (r.ok) router.refresh();
    });

  async function replace(file: File) {
    setMsg({ ok: true, text: "Replacing…" });
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/media/${detail.id}/replace`, {
      method: "POST",
      body: fd,
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({
        ok: true,
        text: "Replaced. Every page using this photo now shows the new one.",
      });
      router.refresh();
      onClose();
    } else
      setMsg({ ok: false, text: body.error ?? "Could not replace the photo." });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-label="Photo details"
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="border border-line px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>

        {isImage ? (
          <>
            <p className="mb-1 text-xs text-stone">
              Click the photo on the most important spot (like her face) so
              crops keep it in view.
            </p>
            <div
              className="relative cursor-crosshair"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setFocal([
                  Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
                  Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
                ]);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={detail.url} alt={alt} className="w-full" />
              <span
                className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-bronze/70 shadow"
                style={{
                  left: `${focal[0] * 100}%`,
                  top: `${focal[1] * 100}%`,
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-stone">
              {[
                ["16:9", "aspect-video"],
                ["4:5", "aspect-[4/5]"],
                ["Square", "aspect-square"],
              ].map(([label, cls]) => (
                <div key={label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detail.url}
                    alt=""
                    className={`${cls} w-full object-cover`}
                    style={{ objectPosition: pos }}
                  />
                  {label}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="bg-[#efece6] p-6 text-center text-sm font-semibold uppercase tracking-[0.14em] text-stone">
            {detail.kind}
          </p>
        )}

        <dl className="mt-4 text-sm text-stone">
          <div>{detail.originalFilename}</div>
          <div>
            {[
              detail.width && detail.height
                ? `${detail.width}×${detail.height}`
                : null,
              size(detail.sizeBytes),
              detail.mimeType,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </dl>

        {isImage ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold">
              Description (alt text) <span className="text-bronze">*</span>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="mt-1 w-full border border-line px-3 py-2 font-normal"
              />
            </label>
            <label className="block text-sm font-semibold">
              Caption
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-1 w-full border border-line px-3 py-2 font-normal"
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="bg-bronze px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        ) : null}

        {msg ? (
          <p
            role="status"
            className={`mt-3 text-sm ${msg.ok ? "text-[#2f6b3a]" : "text-[#9b2c2c]"}`}
          >
            {msg.text}
          </p>
        ) : null}

        <section className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
            Used on
          </h3>
          {detail.usage.length === 0 ? (
            <p className="text-sm text-stone">Not used anywhere yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {detail.usage.map((u, i) => (
                <li key={i}>
                  {u.href ? (
                    <a href={u.href} className="text-bronze underline">
                      {u.label}
                    </a>
                  ) : (
                    u.label
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
          {isImage ? (
            <label className="cursor-pointer border border-bronze-light px-4 py-2 text-sm text-bronze">
              Replace file
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(e) =>
                  e.target.files?.[0] && void replace(e.target.files[0])
                }
              />
            </label>
          ) : null}
          <a
            href={`/api/admin/media/${detail.id}/original`}
            className="border border-line px-4 py-2 text-sm"
          >
            Download original
          </a>
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm("Delete this file permanently?")) return;
              const r = await deleteMedia(detail.id);
              if (r.ok) {
                router.refresh();
                onClose();
              } else
                setMsg({ ok: false, text: r.error ?? "Could not delete." });
            }}
            className="border border-[#9b2c2c] px-4 py-2 text-sm text-[#9b2c2c]"
          >
            Delete
          </button>
        </div>
      </aside>
    </div>
  );
}
