"use client";

import Script from "next/script";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Plausible analytics (privacy-friendly, no cookies) and click tracking: any element with
 * data-track="event_name" fires that event when clicked, e.g. the Buy buttons.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(
        "[data-track]",
      );
      if (el?.dataset.track)
        track(el.dataset.track, {
          label: (el.textContent ?? "").trim().slice(0, 60),
        });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!domain) return null;
  return (
    <>
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
      </Script>
      <Script
        defer
        data-domain={domain}
        src="https://plausible.io/js/script.tagged-events.js"
        strategy="afterInteractive"
      />
    </>
  );
}
