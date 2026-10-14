declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

/** Sends a custom event to Plausible. Does nothing if analytics is not switched on. */
export function track(
  event: string,
  props?: Record<string, string | number | boolean>,
) {
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // analytics must never break the page
  }
}
