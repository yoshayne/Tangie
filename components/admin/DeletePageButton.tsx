"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deletePage } from "@/app/admin/actions-pages";

/** Deleting a page means typing its name, and choosing where its old address should lead. */
export function DeletePageButton({
  id,
  title,
  targets,
}: {
  id: string;
  title: string;
  targets: Array<[string, string]>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [target, setTarget] = useState("/");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="text-sm text-[#9b2c2c] underline"
      >
        Delete
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[min(480px,94vw)] border border-line bg-white p-5 backdrop:bg-black/60"
      >
        <h2 className="font-display text-xl">Delete “{title}”?</h2>
        <p className="mt-2 text-sm text-stone">
          This removes the page and all its sections for good. Anyone who visits
          its old address will be sent to the page you choose.
        </p>
        <label className="mt-4 block text-sm font-semibold">
          Send old visitors to
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 w-full border border-line px-3 py-2 font-normal"
          >
            {targets.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Type the page name to confirm
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-1 w-full border border-line px-3 py-2 font-normal"
          />
        </label>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-[#9b2c2c]">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="border border-line px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || typed.trim() !== title}
            onClick={async () => {
              setBusy(true);
              const res = await deletePage(id, typed, target);
              setBusy(false);
              if (!res.ok) return setError(res.error ?? "Could not delete.");
              dialog.current?.close();
              router.refresh();
            }}
            className="bg-[#9b2c2c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Delete page
          </button>
        </div>
      </dialog>
    </>
  );
}
