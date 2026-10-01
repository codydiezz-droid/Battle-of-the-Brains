import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { m } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { galleryCategories, type GalleryCategory, type GalleryImage } from "../data/types";
import { cx } from "../lib/cx";
import { asset, hasImage } from "../lib/images";
import { easeCalm, enter } from "../lib/motion";
import { Dialog } from "./Dialog";

interface GalleryProps {
  images: GalleryImage[];
  emptyMessage: string;
}

type Filter = "All" | GalleryCategory;

/** Editorial masonry grid with category filters and a keyboard-friendly lightbox. */
export function Gallery({ images, emptyMessage }: GalleryProps) {
  // Skip photos whose files haven't been added yet.
  const available = useMemo(() => images.filter((img) => hasImage(img.src)), [images]);
  const categories = galleryCategories.filter((c) => available.some((img) => img.category === c));
  const [filter, setFilter] = useState<Filter>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = filter === "All" ? available : available.filter((img) => img.category === filter);

  if (available.length === 0) {
    return (
      <div className="border-t border-ink/15 pt-8">
        <p className="max-w-xl font-serif text-[1.6rem] leading-snug italic text-ink/80">{emptyMessage}</p>
        <p className="eyebrow mt-6 text-muted">{galleryCategories.join(" · ")}</p>
      </div>
    );
  }

  return (
    <div>
      {categories.length > 1 && (
        <div role="group" aria-label="Filter photos by category" className="mb-10 flex flex-wrap gap-x-6 gap-y-3">
          {(["All", ...categories] as Filter[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
              className={cx(
                "relative py-1 text-[0.78rem] font-medium uppercase tracking-[0.14em] transition-colors",
                filter === c ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {c}
              <span
                aria-hidden="true"
                className={cx(
                  "absolute inset-x-0 -bottom-0.5 h-[2px] origin-left bg-gold transition-transform duration-500 ease-calm",
                  filter === c ? "scale-x-100" : "scale-x-0",
                )}
              />
            </button>
          ))}
        </div>
      )}

      <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 lg:gap-6">
        {visible.map((img, i) => (
          <m.li
            key={img.src + img.category}
            className="mb-5 break-inside-avoid lg:mb-6"
            initial={enter({ opacity: 0, y: 14 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.8, ease: easeCalm, delay: (i % 3) * 0.06 }}
          >
            <figure>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-haspopup="dialog"
                className="group block w-full overflow-hidden bg-sand"
              >
                <img
                  src={asset(img.src)}
                  alt={img.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full transition-transform duration-[1200ms] ease-calm group-hover:scale-[1.03]"
                />
                <span className="sr-only">, open larger</span>
              </button>
              {(img.caption || img.category) && (
                <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-ink/80">{img.caption}</span>
                  <span className="eyebrow shrink-0 text-[0.62rem] text-muted">{img.category}</span>
                </figcaption>
              )}
            </figure>
          </m.li>
        ))}
      </ul>

      <Lightbox images={visible} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
    </div>
  );
}

interface LightboxProps {
  images: GalleryImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const count = images.length;
  const touchStart = useRef<number | null>(null);
  const image = index === null ? null : images[index];

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onNavigate((index + delta + count) % count);
    },
    [index, count, onNavigate],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  return (
    <Dialog open={image !== null} onClose={onClose} labelledBy="lightbox-caption" className="on-dark">
      {image && index !== null && (
        <div
          className="flex h-[100dvh] w-screen flex-col bg-ink text-cream"
          onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStart.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchStart.current = null;
          }}
        >
          <div className="container-site flex h-16 shrink-0 items-center justify-between">
            <p className="eyebrow tabular-nums text-muted-dark">
              {index + 1} / {count}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 inline-flex h-11 w-11 items-center justify-center hover:bg-cream/10"
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Close photo</span>
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <m.img
              key={image.src}
              src={asset(image.src)}
              alt={image.alt}
              className="max-h-full max-w-full object-contain"
              initial={enter({ opacity: 0 })}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: easeCalm }}
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute top-1/2 left-2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center hover:bg-cream/10 sm:inline-flex"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                  <span className="sr-only">Previous photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute top-1/2 right-2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center hover:bg-cream/10 sm:inline-flex"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                  <span className="sr-only">Next photo</span>
                </button>
              </>
            )}
          </div>

          <div className="container-site flex shrink-0 items-center justify-between gap-6 py-5">
            <div>
              <p className="eyebrow text-[0.62rem] text-gold">{image.category}</p>
              <p id="lightbox-caption" className="mt-1.5 text-sm text-cream/85">
                {image.caption || image.alt}
              </p>
            </div>
            {count > 1 && (
              <div className="flex gap-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="inline-flex h-11 w-11 items-center justify-center"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Previous photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="inline-flex h-11 w-11 items-center justify-center"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Next photo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
