"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteBlock,
  listSavedBlocks,
  type SavedBlock,
} from "@/app/admin/actions-pages";
import { SECTION_META, type SectionGroup } from "@/lib/sections/meta";

const GROUPS: SectionGroup[] = [
  "Page",
  "Content",
  "Pulls from the site",
  "Forms",
];

/** The picker: every section type with a small preview tile, plus the blocks Tangie saved. */
export function AddSectionDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (type: string, props?: Record<string, unknown>) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"types" | "saved">("types");
  const [saved, setSaved] = useState<SavedBlock[] | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
    void listSavedBlocks().then(setSaved);
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label="Add a section"
      className="m-auto h-[88vh] w-[min(920px,96vw)] max-w-none border border-line bg-white p-0 backdrop:bg-black/60"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <h2 className="font-display text-xl">Add a section</h2>
          <div className="flex gap-1" role="tablist">
            {(
              [
                ["types", "Section types"],
                [
                  "saved",
                  `My saved blocks${saved ? ` (${saved.length})` : ""}`,
                ],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`border px-3 py-1.5 text-sm ${tab === k ? "border-bronze bg-[#fbece2]" : "border-line"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="ml-auto border border-line px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "types" ? (
            GROUPS.map((g) => {
              const types = Object.entries(SECTION_META).filter(
                ([, m]) => m.group === g,
              );
              if (!types.length) return null;
              return (
                <section key={g} className="mb-6">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
                    {g}
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {types.map(([type, m]) => (
                      <li key={type}>
                        <button
                          type="button"
                          onClick={() => {
                            onAdd(type);
                            dialog.current?.close();
                          }}
                          className="flex h-full w-full items-start gap-3 border border-line p-3 text-left hover:border-bronze"
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-sand text-lg text-bronze">
                            {m.icon}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">
                              {m.label}
                            </span>
                            <span className="block text-xs text-stone">
                              {m.description}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          ) : saved === null ? (
            <p className="text-stone">Loading…</p>
          ) : saved.length === 0 ? (
            <p className="py-10 text-center text-stone">
              No saved blocks yet. Open any section and choose “Save as reusable
              block” to keep it here.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {saved.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 border border-line p-3"
                >
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => {
                      onAdd(b.type, b.props);
                      dialog.current?.close();
                    }}
                  >
                    <span className="block text-sm font-semibold">
                      {b.name}
                    </span>
                    <span className="block text-xs text-stone">
                      {SECTION_META[b.type]?.label ?? b.type}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="text-sm text-[#9b2c2c] underline"
                    onClick={async () => {
                      if (
                        !window.confirm(`Delete the saved block “${b.name}”?`)
                      )
                        return;
                      await deleteBlock(b.id);
                      setSaved((s) => (s ?? []).filter((x) => x.id !== b.id));
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
