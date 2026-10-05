import { Trophy } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { SectionLabel } from "../components/SectionLabel";
import { Timeline } from "../components/Timeline";
import { journey, result } from "../data/siteData";

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
            <SectionLabel index="04" label="Our journey" />
            <h2 id="journey-heading" className="display mt-8 text-[clamp(2.6rem,6.4vw,6rem)]">
              24 Hours.
              <br />
              One Team.
              <br />
              <span className="text-gold-warm">OneBridge.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[1.05rem] leading-relaxed text-muted lg:col-span-4 lg:justify-self-end">
            From an idea to the finalist stage at the 2026 HSI Battle of the Brains.
          </p>
        </Reveal>

        <div className="mt-20 lg:mt-28">
          <Timeline steps={journey} />
        </div>

        <Reveal className="mt-20 flex justify-center lg:mt-28">
          <p className="inline-flex items-center gap-4 border border-ink/15 bg-paper px-6 py-5 shadow-[0_18px_40px_-28px_rgb(17_17_17/0.45)] sm:px-8">
            <Trophy className="h-6 w-6 shrink-0 text-gold-deep" strokeWidth={1.6} aria-hidden="true" />
            <span className="font-display text-[clamp(1.2rem,2.4vw,1.75rem)] font-semibold tracking-[-0.01em]">
              {result.headline}
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
