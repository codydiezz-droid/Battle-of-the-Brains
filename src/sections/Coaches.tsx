import { LinkedInIcon } from "../components/Icons";
import { coaches, coachesIntro } from "../data/siteData";
import { asset, hasImage } from "../lib/images";
import { displayName, portraitAlt } from "../lib/people";

export function Coaches() {
  return (
    <section id="coaches" className="section coaches-section" aria-labelledby="coaches-title">
      <div className="wrap coaches-grid">
        <div className="section-head" data-reveal>
          <p className="eyebrow">The coaches</p>
          <h2 id="coaches-title" className="h2">
            Behind every round.
          </h2>
          <p className="sub">{coachesIntro}</p>
        </div>
        <ul className="coaches">
          {coaches.map((c, i) => (
            <li key={c.name} className="coach" data-reveal style={{ "--i": i } as React.CSSProperties}>
              {hasImage(c.image) ? (
                <img src={asset(c.image)} alt={portraitAlt(c)} width="120" height="120" loading="lazy" decoding="async" />
              ) : (
                <span className="coach-initials" aria-hidden="true">
                  {c.initials}
                </span>
              )}
              <div>
                <h3>{displayName(c)}</h3>
                <p className="coach-role">{c.title || c.role}</p>
                <div className="member-links">
                  {c.linkedin && (
                    <a href={c.linkedin} target="_blank" rel="noopener noreferrer">
                      <LinkedInIcon size={14} />
                      LinkedIn
                      <span className="sr-only"> profile of {displayName(c)} (opens in a new tab)</span>
                    </a>
                  )}
                  {c.profileUrl && (
                    <a href={c.profileUrl} target="_blank" rel="noopener noreferrer">
                      Southwestern profile
                      <span className="sr-only"> of {displayName(c)} (opens in a new tab)</span>
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
