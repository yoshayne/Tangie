"use client";

import { useEffect } from "react";

/**
 * Reveals each `[data-motion]` section the first time it scrolls into view by adding `.is-in`
 * (the styles are in globals.css). Also picks up sections that appear after navigating to a
 * new page.
 */
export function MotionController() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document
        .querySelectorAll("[data-motion]")
        .forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -6% 0px" },
    );
    const scan = () =>
      document
        .querySelectorAll("[data-motion]:not(.is-in)")
        .forEach((el) => io.observe(el));
    scan();

    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
