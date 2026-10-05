import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { Stat } from "../components/Stat";
import { metrics } from "../data/siteData";

export function Numbers() {
  return (
    <section
      data-nav="onebridge"
      aria-labelledby="numbers-heading"
      className="on-dark grain-light bg-ink py-20 text-cream sm:py-28"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel index="09" label="By the numbers" dark />
          <h2 id="numbers-heading" className="sr-only">
            By the numbers
          </h2>
        </Reveal>
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:mt-14 sm:grid-cols-3 sm:gap-x-8 xl:grid-cols-5">
          {metrics.map((metric) => (
            <Stat key={metric.label} {...metric} />
          ))}
        </dl>
      </div>
    </section>
  );
}
