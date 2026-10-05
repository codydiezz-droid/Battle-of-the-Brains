import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { project } from "../data/siteData";
import { pad } from "../lib/text";

/** OneBridge, the concept we built. Blue and orange nod to the presentation without taking over the page. */
export function Project() {
  return (
    <section
      id="onebridge"
      data-nav="onebridge"
      aria-labelledby="onebridge-heading"
      className="bg-paper py-24 sm:py-32 lg:py-40"
    >
      <div className="container-site">
        <Reveal>
          <SectionLabel index="07" label="What we built" />
          <p className="mt-8 inline-flex items-center gap-2 rounded-lg border border-bridge-blue/25 sm:rounded-full px-3 py-1 text-[0.72rem] font-semibold tracking-[0.08em] text-bridge-blue uppercase">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-bridge-orange" />
            {project.label}
          </p>
        </Reveal>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <Reveal className="lg:col-span-6">
            <h2 id="onebridge-heading" className="display text-[clamp(3.4rem,10vw,9rem)]">
              {project.name}
            </h2>
            <p className="mt-4 font-serif text-[clamp(1.6rem,2.6vw,2.2rem)] leading-snug italic text-bridge-blue">
              {project.tagline}
            </p>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.1}>
            <p className="text-[1.08rem] leading-[1.75] text-ink/80 sm:text-[1.15rem]">{project.intro}</p>
            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-7 inline-flex items-center gap-3 border-b-2 border-bridge-blue py-2 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-bridge-blue transition-colors hover:border-bridge-orange"
              >
                Visit the OneBridge site
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-500 ease-calm group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </Reveal>
        </div>

        <ol className="mt-16 grid gap-4 sm:gap-6 lg:mt-24 lg:grid-cols-3 lg:gap-0">
          {project.steps.map((step, i) => (
            <li key={step.title} className="relative">
              <Reveal
                delay={i * 0.1}
                className="h-full border border-ink/12 bg-cream/50 p-7 sm:p-9 lg:not-first:border-l-0"
              >
                <span aria-hidden="true" className="block h-[3px] w-10 bg-bridge-blue" />
                <p className="eyebrow mt-6 tabular-nums text-bridge-blue">{pad(i + 1)}</p>
                <h3 className="display mt-3 text-[clamp(2rem,3.4vw,2.9rem)]">{step.title}</h3>
                <p className="mt-4 max-w-xs text-[1.02rem] leading-relaxed text-ink/75">{step.description}</p>
              </Reveal>
              {i < project.steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -right-[18px] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink/12 bg-paper text-bridge-orange lg:flex"
                >
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
