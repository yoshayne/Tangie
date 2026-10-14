import { Fragment } from "react";

/** Minimal inline markup for M2 copy: *text* becomes italic. M3+ uses sanitized richtext instead. */
export function renderInline(text: string) {
  return text
    .split(/(\*[^*]+\*)/g)
    .map((part, i) =>
      part.startsWith("*") && part.endsWith("*") ? (
        <em key={i}>{part.slice(1, -1)}</em>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}
