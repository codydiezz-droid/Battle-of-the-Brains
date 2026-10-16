import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Photo } from "../data/types";
import { photoLarge, photoSmall, photoSrcSet } from "../lib/images";

/**
 * Photo wall with a lightbox. The native <dialog> traps focus and closes on
 * Escape; arrow keys and swipes move between photos, and focus returns to the
 * photo that opened it.
 */
export function Gallery({ photos }: { photos: Photo[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const touchX = useRef<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  const show = (i: number) => setIndex((i + photos.length) % photos.length);
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (index !== null && dialog && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }
  }, [index]);

  const current = index === null ? null : photos[index];

  return (
    <>
      <ul className="gallery">
        {photos.map((photo, i) => (
          <li key={photo.src}>
            <button
              type="button"
              className="gallery-item"
              onClick={(e) => {
                openerRef.current = e.currentTarget;
                show(i);
              }}
            >
              <img
                src={photoSmall(photo)}
                srcSet={photoSrcSet(photo)}
                sizes="(min-width: 1100px) 340px, (min-width: 640px) 45vw, 92vw"
                width={photo.width}
                height={photo.height}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
              />
              <span className="gallery-caption">{photo.caption}</span>
              <span className="sr-only"> (open larger)</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label="Photo viewer"
        onClose={() => {
          document.documentElement.style.overflow = "";
          setIndex(null);
          openerRef.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onKeyDown={(e) => {
          if (index === null) return;
          if (e.key === "ArrowRight") show(index + 1);
          if (e.key === "ArrowLeft") show(index - 1);
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null || index === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        {current && index !== null && (
          <figure className="lightbox-figure">
            <img src={photoLarge(current)} width={current.width} height={current.height} alt={current.alt} />
            <figcaption aria-live="polite">
              <span>{current.caption}</span>
              <span className="lightbox-count">
                {index + 1} of {photos.length}
              </span>
            </figcaption>
          </figure>
        )}
        <button type="button" className="lightbox-btn lightbox-close" onClick={close} aria-label="Close photo viewer">
          <X size={22} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="lightbox-btn lightbox-prev"
          onClick={() => index !== null && show(index - 1)}
          aria-label="Previous photo"
        >
          <ChevronLeft size={26} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="lightbox-btn lightbox-next"
          onClick={() => index !== null && show(index + 1)}
          aria-label="Next photo"
        >
          <ChevronRight size={26} aria-hidden="true" />
        </button>
      </dialog>
    </>
  );
}
