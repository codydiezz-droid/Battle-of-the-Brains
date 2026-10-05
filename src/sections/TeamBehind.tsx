import { m, useReducedMotion } from "framer-motion";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { coaches, team, teamAndCoachesPhoto } from "../data/siteData";
import { asset, hasImage, positionStyle } from "../lib/images";
import { easeCalm } from "../lib/motion";
import { spellNumber } from "../lib/text";

/** The students with their coaches. Hidden until the photo is added to public/. */
export function TeamBehind() {
  const reduceMotion = useReducedMotion();
  if (!hasImage(teamAndCoachesPhoto.src)) return null;

  return (
    <section data-nav="team" aria-labelledby="behind-heading" className="pb-24 sm:pb-32 lg:pb-40">
      <div className="container-site">
        <Reveal className="grid gap-8 border-t border-ink/15 pt-16 sm:pt-20 lg:grid-cols-12 lg:items-end lg:pt-24">
          <div className="lg:col-span-7">
            <SectionLabel index="06" label="Students and coaches" />
            <h2 id="behind-heading" className="display mt-8 text-[clamp(2.6rem,6.4vw,6rem)]">
              The team behind
              <br />
              the pitch
            </h2>
          </div>
          <p className="max-w-md font-serif text-[1.6rem] leading-snug italic text-ink/80 lg:col-span-5 lg:justify-self-end">
            {spellNumber(team.length, true)} students, {spellNumber(coaches.length)} coaches, one intense 24-hour
            challenge.
          </p>
        </Reveal>

        <figure className="mt-12 lg:mt-16">
          <m.div
            className="mx-auto w-fit max-w-full overflow-hidden bg-ink"
            initial={reduceMotion ? false : { clipPath: "inset(4% 3% 4% 3%)" }}
            whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.4, ease: easeCalm }}
          >
            {/* Shown whole, never cropped, so no one is cut out of the frame. */}
            <img
              src={asset(teamAndCoachesPhoto.src)}
              alt={teamAndCoachesPhoto.alt}
              loading="lazy"
              decoding="async"
              style={positionStyle(teamAndCoachesPhoto.objectPosition)}
              className="block h-auto max-h-[88vh] w-auto max-w-full"
            />
          </m.div>
          {teamAndCoachesPhoto.caption && (
            <figcaption className="mt-4 text-sm text-ink/80 sm:mt-5">{teamAndCoachesPhoto.caption}</figcaption>
          )}
        </figure>
      </div>
    </section>
  );
}
