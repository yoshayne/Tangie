"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Runs inside the page builder's preview frame only. It lets the editor refresh the preview
 * without losing the scroll position, and lets a click on a section select it in the editor.
 * Links and buttons do nothing here, so Tangie cannot wander off the page being edited.
 */
export function PreviewBridge() {
  const router = useRouter();

  useEffect(() => {
    let selected: string | null = null;
    const origin = window.location.origin;

    const mark = () => {
      document.querySelectorAll("[data-section-id]").forEach((el) => {
        const on = el.getAttribute("data-section-id") === selected;
        if (on) el.setAttribute("data-selected", "true");
        else el.removeAttribute("data-selected");
      });
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin) return;
      const d = e.data as { type?: string; id?: string | null } | null;
      if (d?.type === "tb-refresh") router.refresh();
      if (d?.type === "tb-select") {
        selected = d.id ?? null;
        mark();
        if (selected)
          document
            .querySelector(`[data-section-id="${selected}"]`)
            ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("[data-section-id]");
      e.preventDefault();
      e.stopPropagation();
      if (!el) return;
      const id = el.getAttribute("data-section-id");
      selected = id;
      mark();
      window.parent.postMessage({ type: "tb-select", id }, origin);
    };
    const onSubmit = (e: Event) => e.preventDefault();

    // After a refresh the page content is replaced; put the highlight back.
    const observer = new MutationObserver(() => mark());
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.parent.postMessage({ type: "tb-ready" }, origin);
    return () => {
      observer.disconnect();
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [router]);

  return (
    <style>{`
      [data-section-id] { cursor: pointer; position: relative; }
      [data-section-id]:hover { outline: 2px solid rgba(140,107,63,.45); outline-offset: -2px; }
      [data-section-id][data-selected="true"] { outline: 3px solid #8c6b3f; outline-offset: -3px; }
    `}</style>
  );
}
