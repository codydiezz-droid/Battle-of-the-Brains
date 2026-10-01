import { m, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { event, teamPhoto } from "../data/siteData";
import { asset, hasImage, positionStyle } from "../lib/images";
import { easeCalm } from "../lib/motion";

/**
 * The real team photograph — the most important image on the site.
 * Shown large and, by default, uncropped so no one is cut out of the frame.
 */
export function TeamPhoto() {
  const reduceMotion = useReducedMotion();
  const present = hasImage(teamPhoto.src);
  const style = {
    ...positionStyle(teamPhoto.objectPosition, "50% 40%"),
    "--ratio-mobile": teamPhoto.aspectRatio?.mobile ?? "auto",
    "--ratio-desktop": teamPhoto.aspectRatio?.desktop ?? "auto",
  } as CSSProperties;

  return (
    <section data-nav="home" aria-label="Team photograph" className="grain pb-24 sm:pb-32 lg:pb-40">
      <figure className="container-site">
        <m.div
          className="overflow-hidden bg-ink"
          initial={reduceMotion ? false : { clipPath: "inset(4% 3% 4% 3%)" }}
          whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 1.4, ease: easeCalm }}
        >
          {present ? (
            <m.img
              src={asset(teamPhoto.src)}
              alt={teamPhoto.alt}
              fetchPriority="high"
              decoding="async"
              style={style}
              className="img-position block max-h-[88vh] w-full object-cover [aspect-ratio:var(--ratio-mobile)] md:[aspect-ratio:var(--ratio-desktop)]"
              initial={reduceMotion ? false : { scale: 1.06 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 1.8, ease: easeCalm }}
            />
          ) : (
            <PhotoPlaceholder />
          )}
        </m.div>

        <figcaption className="mt-4 flex flex-col gap-1 text-sm sm:mt-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
          <span className="text-ink/80">{teamPhoto.caption}</span>
          <span className="eyebrow shrink-0 text-muted">{teamPhoto.date}</span>
        </figcaption>
      </figure>
    </section>
  );
}

/** Shown only until public/images/team/botb-team-2026.jpg is added. */
function PhotoPlaceholder() {
  return (
    <div className="grain-light relative flex aspect-[4/3] flex-col items-center justify-center gap-5 p-8 text-center text-cream sm:aspect-[16/9]">
      <span aria-hidden="true" className="absolute inset-4 border border-cream/15 sm:inset-6" />
      <span className="eyebrow text-gold">{event.school}</span>
      <span className="display text-[clamp(2.5rem,8vw,6.5rem)]">{event.year}</span>
      <span className="eyebrow text-muted-dark">{event.name}</span>
      {import.meta.env.DEV && (
        <span className="absolute bottom-8 text-xs text-muted-dark sm:bottom-10">
          Add the team photo at public{teamPhoto.src}
        </span>
      )}
    </div>
  );
}
