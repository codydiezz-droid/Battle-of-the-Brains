import { Reveal } from "../components/Reveal";
import { coaches, event, team } from "../data/siteData";
import { spellNumber } from "../lib/text";

export function Closing() {
  return (
    <section aria-labelledby="closing-heading" className="grain border-t border-ink/10 py-32 sm:py-44 lg:py-56">
      <div className="container-site">
        <Reveal>
          <span aria-hidden="true" className="block h-[2px] w-16 bg-gold" />
          <h2 id="closing-heading" className="display mt-10 text-[clamp(2.4rem,5.8vw,6.25rem)] leading-[0.95]">
            Grateful for the opportunity.
            <br />
            Proud to represent Southwestern.
          </h2>
        </Reveal>

        <Reveal className="mt-20 grid gap-12 sm:mt-28 lg:grid-cols-12" delay={0.1}>
          <p className="eyebrow flex flex-col gap-2 text-ink lg:col-span-4">
            <span>{event.school}</span>
            <span>{event.name}</span>
            <span className="text-gold-deep">{event.year}</span>
          </p>
          <p className="max-w-lg font-serif text-[1.7rem] leading-snug italic text-ink/85 sm:text-[2rem] lg:col-span-6 lg:col-start-7">
            {spellNumber(team.length, true)} students. {spellNumber(coaches.length, true)} coaches. One experience we’ll
            remember.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
