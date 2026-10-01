import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { Timeline } from "../components/Timeline";
import { journey } from "../data/siteData";

export function Journey() {
  return (
    <section
      id="journey"
      data-nav="journey"
      aria-labelledby="journey-heading"
      className="grain py-24 sm:py-32 lg:py-40"
    >
      <div className="container-site">
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <SectionLabel index="05" label="Journey" />
            <h2 id="journey-heading" className="display mt-8 text-[clamp(2.8rem,7vw,6.4rem)]">
              Our journey
            </h2>
          </div>
          <p className="max-w-sm text-[1.05rem] leading-relaxed text-muted lg:col-span-4 lg:justify-self-end">
            From the first meeting to the final presentation — the steps that brought us here.
          </p>
        </Reveal>

        <div className="mt-20 lg:mt-28">
          <Timeline steps={journey} />
        </div>
      </div>
    </section>
  );
}
