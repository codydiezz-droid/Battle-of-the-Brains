import { Reveal } from "../components/Reveal";
import { gratitude } from "../data/siteData";

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
            Acknowledgments
          </p>
          <h2 id="thanks-heading" className="display mt-8 text-[clamp(3.4rem,11vw,11rem)] leading-[0.84]">
            With
            <br />
            <span className="text-gold">gratitude.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid lg:mt-20 lg:grid-cols-12">
          <Reveal
            className="text-[1.08rem] leading-[1.8] text-cream/80 sm:text-[1.2rem] lg:col-span-6 lg:col-start-7"
            delay={0.1}
          >
            <p>{gratitude.paragraph}</p>
          </Reveal>
        </div>

        <ul className="mt-20 grid border-t border-cream/15 sm:grid-cols-2 lg:mt-28 lg:grid-cols-3">
          {gratitude.recognize.map((name) => (
            <li
              key={name}
              className="border-b border-cream/15 py-6 font-display text-[1.25rem] font-semibold leading-tight tracking-[-0.01em] sm:py-8 sm:pr-6"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
