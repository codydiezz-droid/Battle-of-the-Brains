import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { competition, competitionGraphic, event } from "../data/siteData";
import { asset, hasImage } from "../lib/images";

export function Competition() {
  const facts = [
    ["Dates", event.datesShort],
    ["Representing", event.school],
    ["Participation", event.participation],
  ];

  return (
    <section data-nav="story" aria-labelledby="competition-heading" className="bg-paper py-24 sm:py-32 lg:py-40">
      <div className="container-site grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-6">
          <figure className="bg-cream p-4 sm:p-6 lg:p-8">
            {hasImage(competitionGraphic.src) ? (
              <img
                src={asset(competitionGraphic.src)}
                alt={competitionGraphic.alt}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            ) : (
              <GraphicPlaceholder />
            )}
          </figure>
        </Reveal>

        <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.1}>
          <SectionLabel index="02" label="The competition" />
          <h2 id="competition-heading" className="display mt-8 text-[clamp(2.3rem,4.6vw,4.4rem)]">
            {event.year} {event.name}
          </h2>

          <dl className="mt-10 border-t border-ink/15">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-1 border-b border-ink/15 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <dt className="eyebrow text-green">{label}</dt>
                <dd className="font-display text-[1.25rem] font-semibold tracking-[-0.01em] sm:text-right">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 max-w-md text-[1.05rem] leading-[1.75] text-ink/80 sm:text-[1.12rem]">
            {competition.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** Typographic stand-in until public/images/botb-2026-southwestern.png is added. Decorative — the facts are listed beside it. */
function GraphicPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="grain-light relative flex aspect-square flex-col justify-between bg-green p-8 text-cream sm:p-12"
    >
      <span className="eyebrow text-gold">{event.name}</span>
      <span className="display text-[clamp(5rem,16vw,11rem)] leading-[0.8]">{event.year}</span>
      <span className="flex flex-col gap-1">
        <span className="font-display text-xl font-semibold">{event.school}</span>
        <span className="eyebrow text-cream/70">2nd-Year Participant · {event.datesShort}</span>
      </span>
    </div>
  );
}
