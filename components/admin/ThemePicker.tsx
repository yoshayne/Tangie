"use client";

import { useAdminForm } from "./ActionForm";
import { THEMES, type ThemeId } from "@/lib/theme";

/** Choose the site's colour theme: a card per theme with its colours shown. */
export function ThemePicker({ name = "theme" }: { name?: string }) {
  const { state, defaults } = useAdminForm();
  const current = (state.values?.[name] ??
    String(defaults[name] ?? "royal")) as ThemeId;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">Color theme</legend>
      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(THEMES) as ThemeId[]).map((id) => {
          const t = THEMES[id];
          return (
            <label
              key={id}
              className="flex cursor-pointer flex-col gap-3 border border-line bg-white p-3 has-[:checked]:border-bronze has-[:checked]:ring-1 has-[:checked]:ring-bronze"
            >
              <span
                className="flex h-12 overflow-hidden border border-line"
                aria-hidden
              >
                {t.swatches.map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: c }} />
                ))}
              </span>
              <span className="flex items-start gap-2">
                <input
                  type="radio"
                  name={name}
                  value={id}
                  defaultChecked={current === id}
                  className="mt-1 h-4 w-4 accent-[#b34815]"
                />
                <span>
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className="block text-xs text-stone">
                    {t.description}
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-stone">
        Changes the whole site: backgrounds, bands, buttons, links and labels.
        Photos stay as they are.
      </p>
    </fieldset>
  );
}
