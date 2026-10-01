import { Reveal } from "../components/Reveal";
import { Portrait } from "../components/Portrait";
import { coaches, gratitude } from "../data/siteData";
import { displayName } from "../lib/people";

export function ThankYou() {
  return (
    <section
      data-nav="coaches"
      aria-labelledby="thanks-heading"
      className="on-dark grain-light bg-ink py-28 text-cream sm:py-36 lg:py-48"
    >
      <div className="container-site">
        <Reveal>
          <p className="eyebrow flex items-center gap-3 text-gold">
            <span aria-hidden="true" className="h-px w-10 bg-gold" />
            With gratitude
          </p>
          <h2 id="thanks-heading" className="display mt-8 text-[clamp(3.6rem,13vw,13rem)] leading-[0.84]">
            Thank you,
            <br />
            <span className="text-gold">coaches.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid lg:mt-20 lg:grid-cols-12">
          <Reveal
            className="space-y-6 text-[1.08rem] leading-[1.8] text-cream/80 sm:text-[1.2rem] lg:col-span-6 lg:col-start-7"
            delay={0.1}
          >
            {gratitude.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </Reveal>
        </div>

        <ul className="mt-20 grid border-t border-cream/15 sm:grid-cols-3 lg:mt-28">
          {coaches.map((coach, i) => (
            <li
              key={coach.name}
              className="flex items-center gap-5 border-b border-cream/15 py-6 sm:border-b-0 sm:py-8 sm:pr-6 sm:not-first:border-l sm:not-first:pl-6"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-cream/20 sm:h-20 sm:w-20">
                <Portrait person={coach} tone={i + 1} variant="compact" />
              </div>
              <div>
                <p className="font-display text-[1.25rem] font-semibold leading-tight tracking-[-0.01em]">
                  {displayName(coach)}
                </p>
                {coach.role && <p className="eyebrow mt-1.5 text-[0.65rem] text-muted-dark">{coach.role}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
