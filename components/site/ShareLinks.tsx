"use client";

import { useState } from "react";

/** Share a page: Facebook, LinkedIn, email, and copy-link. `url` is the full public address. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const link =
    "text-link font-semibold uppercase tracking-[0.16em] text-bronze-text hover:text-[#6f5430]";

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-3"
      aria-label="Share"
    >
      <span className="text-eyebrow font-semibold uppercase tracking-[0.18em] text-stone">
        Share
      </span>
      <a
        className={link}
        href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Facebook
      </a>
      <a
        className={link}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
      <a className={link} href={`mailto:?subject=${t}&body=${u}`}>
        Email
      </a>
      <button
        type="button"
        className={link}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy this link", url);
          }
        }}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
