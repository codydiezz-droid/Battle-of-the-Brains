import { CoachCard } from "../components/CoachCard";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { coaches } from "../data/siteData";

export function Coaches() {
  return (
    <section
      id="coaches"
      data-nav="coaches"
      aria-labelledby="coaches-heading"
      className="bg-paper py-24 sm:py-32 lg:py-40"
    >
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-8">
            <SectionLabel index="04" label="Coaches" />
            <h2 id="coaches-heading" className="display mt-8 text-[clamp(2.6rem,6.4vw,6rem)]">
              The people
              <br />
              who guided us
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-4" delay={0.1}>
            <p className="font-serif text-[1.6rem] leading-snug italic text-ink/80 lg:text-right">
              Great teams don’t get there alone.
            </p>
          </Reveal>
        </div>

        <ul className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-14 lg:mt-24 lg:gap-x-10">
          {coaches.map((coach, i) => (
            <li key={coach.name} className="w-full sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-5rem)/3)]">
              <Reveal delay={i * 0.08}>
                <CoachCard coach={coach} index={i} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
