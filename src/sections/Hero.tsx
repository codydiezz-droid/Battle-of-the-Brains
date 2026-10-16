import { HeroBridge } from "../components/HeroBridge";
import { event, result, team } from "../data/siteData";
import { spellNumber } from "../lib/text";

const countries = new Set(team.map((m) => m.country)).size;

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <HeroBridge />
      <div className="wrap hero-content">
        <p className="award-line">
          <span className="award-rule" aria-hidden="true" />
          {result.award} · {event.name} {event.year}
        </p>
        <h1 id="hero-title">
          {spellNumber(team.length, true)} students. Three coaches.{" "}
          <span>One Southwestern team.</span>
        </h1>
        <p className="hero-lead">
          In Southwestern University’s {event.yearsParticipating === 2 ? "second" : spellNumber(event.yearsParticipating)}{" "}
          year at the competition, {spellNumber(team.length)} students from {spellNumber(countries)} countries had 24
          hours to build a company. They built OneBridge, reached the final round, and took first place for business
          solution.
        </p>
        <div className="actions">
          <a className="btn" href="#team">
            Meet the team
          </a>
          <a className="btn btn-quiet" href="#onebridge">
            See what we built
          </a>
        </div>
      </div>
      <a className="scroll-cue" href="#team" aria-label="Skip to the team">
        <span aria-hidden="true" />
      </a>
    </section>
  );
}
