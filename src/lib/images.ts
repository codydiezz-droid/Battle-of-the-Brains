import type { CSSProperties } from "react";
import availableImages from "virtual:public-images";
import type { ObjectPosition, ResponsivePosition } from "../data/types";

/** True when the file exists in /public, so we never render a broken image. */
export function hasImage(src?: string): src is string {
  return Boolean(src) && availableImages.has(src as string);
}

/**
 * Turns "/images/x.jpg" into a URL that works both locally and when the site is
 * served from a GitHub Pages repository subpath.
 */
export function asset(src: string): string {
  return import.meta.env.BASE_URL + src.replace(/^\//, "");
}

/**
 * CSS variables consumed by the `.img-position` utility in index.css, which
 * switches object-position between phones and larger screens.
 */
export function positionStyle(
  position: ObjectPosition | ResponsivePosition | undefined,
  fallback = "50% 50%",
): CSSProperties {
  const { mobile, desktop } = typeof position === "string" ? { mobile: position, desktop: position } : (position ?? {});
  return {
    "--pos-mobile": mobile || desktop || fallback,
    "--pos-desktop": desktop || mobile || fallback,
  } as CSSProperties;
}
