import availableImages from "virtual:public-images";
import type { Photo } from "../data/types";

/** True when the file exists in /public, so we never render a broken image. */
export function hasImage(src?: string): src is string {
  return Boolean(src) && availableImages.has(src as string);
}

/** Same check for other files in /public, such as the presentation deck. */
export const hasFile = hasImage;

/**
 * Turns "/images/x.jpg" into a URL that works both locally and when the site is
 * served from a GitHub Pages repository subpath.
 */
export function asset(src: string): string {
  if (/^(data:|https?:)/.test(src)) return src;
  // The single-file HTML build embeds every photo and lists them here.
  const embedded = (window as Window & { __BOTB_IMAGES__?: Record<string, string> }).__BOTB_IMAGES__;
  if (embedded?.[src]) return embedded[src];
  return import.meta.env.BASE_URL + src.replace(/^\//, "");
}

/** The two sizes every event photo comes in. */
export const photoSmall = (photo: Photo) => asset(`${photo.src}-800.webp`);
export const photoLarge = (photo: Photo) => asset(`${photo.src}-1600.webp`);
export const photoSrcSet = (photo: Photo) => `${photoSmall(photo)} 800w, ${photoLarge(photo)} 1600w`;
