"use client";

import type { DraftSettings } from "@/lib/page-builder/types";
import type { ImageRef } from "@/lib/sections/types";
import { ImageInput } from "./FieldForm";

const INPUT =
  "w-full border border-line bg-white px-3 py-2 text-[15px] disabled:bg-[#f0eee9]";

function Counter({ len, ideal }: { len: number; ideal: number }) {
  const cls = len > ideal ? "text-[#9b2c2c]" : "text-stone";
  return (
    <span className={`text-xs ${cls}`}>
      {len}/{ideal}
    </span>
  );
}

/** Page settings: name, address, search engine text, share photo and menu. */
export function SettingsPanel({
  settings,
  onChange,
  isSystem,
  isTemplate,
  published,
  onSlugTouched,
}: {
  settings: DraftSettings;
  onChange: (s: DraftSettings) => void;
  isSystem: boolean;
  isTemplate: boolean;
  published: boolean;
  onSlugTouched: () => void;
}) {
  const set = (patch: Partial<DraftSettings>) =>
    onChange({ ...settings, ...patch });
  const og: ImageRef | undefined = settings.ogMedia
    ? {
        mediaId: settings.ogMedia.id,
        src: settings.ogMedia.url,
        alt: settings.ogMedia.alt,
        width: 0,
        height: 0,
      }
    : undefined;
  const host = "www.tangiebeaty.com";
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="ps-title" className="mb-1 block text-sm font-semibold">
          Page name <span className="text-bronze">*</span>
        </label>
        <input
          id="ps-title"
          className={INPUT}
          value={settings.title}
          maxLength={80}
          onChange={(e) => set({ title: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="ps-slug" className="mb-1 block text-sm font-semibold">
          Web address
        </label>
        <div className="flex items-center gap-1">
          <span className="text-stone">/</span>
          <input
            id="ps-slug"
            className={INPUT}
            value={settings.slug}
            disabled={isSystem}
            onChange={(e) => {
              onSlugTouched();
              set({
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/-{2,}/g, "-")
                  .replace(/^-/, ""),
              });
            }}
          />
        </div>
        <p className="mt-1 text-xs text-stone">
          {isSystem
            ? "This is a built-in page, so its address is fixed."
            : published
              ? "Changing this later sends visitors from the old address to the new one automatically."
              : "Lowercase letters, numbers and dashes. It follows the page name until you change it."}
        </p>
      </div>
      {!isTemplate ? (
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[#8c6b3f]"
            checked={settings.showInMenu}
            onChange={(e) => set({ showInMenu: e.target.checked })}
          />
          Show in the header menu
        </label>
      ) : null}

      <fieldset className="space-y-4 border border-line p-3">
        <legend className="px-1 text-sm font-semibold">
          Search engines and sharing
        </legend>
        <div>
          <div className="mb-1 flex justify-between">
            <label htmlFor="ps-seot" className="text-sm font-semibold">
              Search title
            </label>
            <Counter len={settings.seoTitle.length} ideal={60} />
          </div>
          <input
            id="ps-seot"
            className={INPUT}
            value={settings.seoTitle}
            maxLength={120}
            onChange={(e) => set({ seoTitle: e.target.value })}
            placeholder={`${settings.title || "Page"} | Tangie Brickhouse-Beaty`}
          />
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <label htmlFor="ps-seod" className="text-sm font-semibold">
              Search description
            </label>
            <Counter len={settings.seoDescription.length} ideal={160} />
          </div>
          <textarea
            id="ps-seod"
            rows={3}
            className={INPUT}
            value={settings.seoDescription}
            maxLength={320}
            onChange={(e) => set({ seoDescription: e.target.value })}
          />
        </div>
        <div
          className="border border-line bg-white p-3"
          aria-label="How this page may look in Google"
        >
          <p className="truncate text-xs text-[#1a6b3a]">
            {host}/{settings.slug}
          </p>
          <p className="truncate text-lg text-[#1a0dab]">
            {settings.seoTitle ||
              `${settings.title || "Page"} | Tangie Brickhouse-Beaty`}
          </p>
          <p className="line-clamp-2 text-sm text-stone">
            {settings.seoDescription ||
              "No description yet. Search engines will pick some text from the page."}
          </p>
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold">Share photo</p>
          <ImageInput
            value={og}
            onChange={(v) =>
              set({
                ogMedia: v?.mediaId
                  ? { id: v.mediaId, url: v.src, alt: v.alt }
                  : null,
              })
            }
          />
          <p className="mt-1 text-xs text-stone">
            Shown when the page is shared on social media.
          </p>
        </div>
      </fieldset>
    </div>
  );
}
