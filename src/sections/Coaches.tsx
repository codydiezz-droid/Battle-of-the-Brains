import { CoachCard } from "../components/CoachCard";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { coaches, coachesIntro } from "../data/siteData";

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
            <SectionLabel index="10" label="Coaches" />
            <h2 id="coaches-heading" className="display mt-8 text-[clamp(2.6rem,6.4vw,6rem)]">
              The people
              <br />
              in our corner
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-4 lg:grid" delay={0.1}>
            <p className="max-w-md text-[1.05rem] leading-[1.75] text-ink/80 sm:text-[1.12rem] lg:justify-self-end">
              {coachesIntro}
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
