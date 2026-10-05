import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { story } from "../data/siteData";

export function Story() {
  const [lede, ...rest] = story.paragraphs;

  return (
    <section
      id="story"
      data-nav="story"
      aria-labelledby="story-heading"
      className="border-t border-ink/10 py-24 sm:py-32 lg:py-40"
    >
      <div className="container-site">
        <SectionLabel index="01" label="Our story" />

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-5">
            <h2 id="story-heading" className="display text-[clamp(2.6rem,6vw,5.6rem)] lg:sticky lg:top-28">
              Our second year.
              <br />
              <span className="text-gold-warm">A new chapter.</span>
            </h2>
          </Reveal>

          <Reveal className="lg:col-span-6 lg:col-start-7" delay={0.1}>
            <p className="font-display text-[clamp(1.4rem,2.3vw,1.9rem)] leading-[1.25] font-medium tracking-[-0.015em]">
              {lede}
            </p>
            <div className="mt-8 space-y-6 text-[1.05rem] leading-[1.75] text-ink/80 sm:text-[1.15rem]">
              {rest.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
}
