import { m } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { coaches, event, team } from "../data/siteData";
import { easeCalm, enter } from "../lib/motion";
import { spellNumber } from "../lib/text";

export function Hero() {
  const lines = [`${spellNumber(team.length, true)} students.`, "One team."];

  return (
    <section id="home" data-nav="home" aria-labelledby="hero-heading" className="grain">
      <div className="container-site pt-10 pb-12 sm:pt-16 lg:pt-20 lg:pb-16">
        <m.div
          className="flex flex-col gap-2 border-b border-ink/15 pb-5 sm:flex-row sm:items-center sm:justify-between"
          initial={enter({ opacity: 0 })}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: easeCalm }}
        >
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-10 bg-gold" />
            {event.name} · {event.year}
          </p>
          <p className="eyebrow text-muted">{event.dates}</p>
        </m.div>

        <div className="mt-8 grid gap-10 sm:mt-12 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-8">
            <h1 id="hero-heading" className="display text-[clamp(3.4rem,10.8vw,10.5rem)] lg:whitespace-nowrap">
              {lines.map((line, i) => (
                <span key={line} className="block pb-[0.04em] [clip-path:inset(0_-100vw_0_0)]">
                  <m.span
                    className="block"
                    initial={enter({ y: "105%" })}
                    animate={{ y: 0 }}
                    transition={{ duration: 1.1, ease: easeCalm, delay: 0.15 + i * 0.12 }}
                  >
                    {line}
                  </m.span>
                </span>
              ))}
            </h1>

            <m.p
              className="mt-8 font-display text-[clamp(1.45rem,2.5vw,2.2rem)] leading-[1.15] font-medium tracking-[-0.015em] lg:mt-10"
              initial={enter({ opacity: 0, y: 14 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: easeCalm, delay: 0.45 }}
            >
              Representing {event.school}
              <br className="hidden sm:block" /> at the {event.year} {event.name}.
            </m.p>
          </div>

          <m.div
            className="lg:col-span-4"
            initial={enter({ opacity: 0, y: 14 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: easeCalm, delay: 0.6 }}
          >
            <p className="max-w-md text-[1.02rem] leading-relaxed text-muted sm:text-lg">
              {spellNumber(team.length, true)} students, {spellNumber(coaches.length)} coaches, and one week built
              around learning, collaboration, and representing the community that brought us together.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href="#team"
                className="group inline-flex items-center gap-3 bg-ink px-6 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-espresso"
              >
                Meet the team
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-500 ease-calm group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#journey"
                className="group inline-flex items-center gap-3 border-b-2 border-ink py-2 text-[0.75rem] font-semibold uppercase tracking-[0.16em] transition-colors hover:border-gold"
              >
                Our journey
                <ArrowDown
                  className="h-4 w-4 transition-transform duration-500 ease-calm group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </a>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
