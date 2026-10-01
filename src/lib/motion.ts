/** Shared easing for every animation on the site — calm, no bounce. */
export const easeCalm = [0.22, 1, 0.36, 1] as const;

/**
 * Starting state for entrance animations. Building with VITE_STATIC_REVEAL=1
 * skips them, so a snapshot of the page (or a shared-link preview) shows
 * every section fully visible without scrolling.
 */
export function enter<T>(from: T): T | false {
  return import.meta.env.VITE_STATIC_REVEAL === "1" ? false : from;
}
