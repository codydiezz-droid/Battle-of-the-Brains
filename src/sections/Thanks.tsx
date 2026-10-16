import { event, gratitude, settings } from "../data/siteData";

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
