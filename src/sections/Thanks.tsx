import { ArrowRight } from "lucide-react";
import { event, gratitude, miniGame, settings } from "../data/siteData";

/** Thanks, and a single line in place of a footer. */
export function Thanks() {
  return (
    <section className="thanks" aria-labelledby="thanks-title">
      <div className="wrap thanks-inner" data-reveal>
        <h2 id="thanks-title" className="h2">
          Thank you.
        </h2>
        <p className="thanks-text">{gratitude.paragraph}</p>
        <ul className="thanks-names" aria-label="With special thanks to">
          {gratitude.recognize.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
      <div className="wrap" data-reveal>
        <a className="game-card" href={miniGame.url}>
          <svg className="game-ball" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="22" fill="#fff" />
            <path d="M24 14l8 6-3 9h-10l-3-9z" fill="#091d3f" />
            <path d="M24 2v12M32 20l11-4M29 29l7 10M19 29l-7 10M16 20L5 16" stroke="#091d3f" strokeWidth="2.5" />
          </svg>
          <span className="game-text">
            <span className="game-kicker">Mini game</span>
            <span className="game-title">{miniGame.name}</span>
            <span className="game-blurb">{miniGame.blurb}</span>
          </span>
          <span className="game-go">
            Play
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        </a>
      </div>
      <p className="wrap site-foot">
        Made by the {event.school} team · {event.name} {event.year}
        {settings.githubUrl && (
          <>
            {" · "}
            <a href={settings.githubUrl} target="_blank" rel="noopener noreferrer">
              Source<span className="sr-only"> on GitHub (opens in a new tab)</span>
            </a>
          </>
        )}
      </p>
    </section>
  );
}
