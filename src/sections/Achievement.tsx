import { CalendarDays, Landmark, Medal, Trophy } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { finalistsGraphic, result } from "../data/siteData";
import { asset, hasImage } from "../lib/images";

const icons = [CalendarDays, Landmark, Medal, Trophy];

/** The result: 1st place for the business solution, and finalist. Never worded as winning the whole competition. */
export function Achievement() {
  const [place, title] = result.headline.split(" — ");
  const showGraphic = hasImage(finalistsGraphic.src);

  return (
    <section
      id="result"
      data-nav="story"
      aria-labelledby="result-heading"
      className="on-dark grain-light bg-ink py-24 text-cream sm:py-32 lg:py-40"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel index="03" label="The result" dark />
          <h2 id="result-heading" className="display mt-8 text-[clamp(3rem,9vw,8.75rem)] leading-[0.86]">
            <span className="text-gold">{place}</span>
            <span className="sr-only"> — </span>
            <span className="block">{title}</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-6" delay={0.1}>
            <p className="font-display text-[clamp(1.3rem,2.1vw,1.75rem)] leading-[1.3] font-medium tracking-[-0.01em] text-cream/90">
              {result.summary}
            </p>
          </Reveal>

          <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.15}>
            <ul className="border-t border-cream/20">
              {result.credentials.map((item, i) => {
                const Icon = icons[i % icons.length];
                const highlight = i === result.credentials.length - 1;
                return (
                  <li key={item} className="flex items-center gap-4 border-b border-cream/20 py-4">
                    <Icon
                      className={highlight ? "h-5 w-5 shrink-0 text-gold" : "h-5 w-5 shrink-0 text-cream/55"}
                      strokeWidth={1.6}
                      aria-hidden="true"
                    />
                    <span
                      className={
                        highlight
                          ? "font-display text-[1.2rem] font-semibold tracking-[-0.01em] text-gold"
                          : "font-display text-[1.2rem] font-semibold tracking-[-0.01em]"
                      }
                    >
                      {item}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>

        {showGraphic && (
          <Reveal className="mt-16 sm:mt-20 lg:mt-28" delay={0.1}>
            <figure className="mx-auto max-w-5xl">
              <div className="overflow-hidden rounded-2xl bg-cream p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)] ring-1 ring-cream/10 sm:p-3">
                <img
                  src={asset(finalistsGraphic.src)}
                  alt={finalistsGraphic.alt}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full rounded-xl"
                />
              </div>
              {finalistsGraphic.caption && (
                <figcaption className="mt-4 text-center text-sm text-cream/70 sm:mt-5">
                  {finalistsGraphic.caption}
                </figcaption>
              )}
            </figure>
          </Reveal>
        )}
      </div>
    </section>
  );
}
