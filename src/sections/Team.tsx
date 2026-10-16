import { LinkedInIcon } from "../components/Icons";
import { team } from "../data/siteData";
import type { TeamMember } from "../data/types";
import { asset, hasImage } from "../lib/images";
import { portraitAlt, visibleEmail } from "../lib/people";
import { spellNumber } from "../lib/text";

const countries = new Set(team.map((m) => m.country)).size;

/** The photo, or initials when the file is missing. */
function portrait(m: TeamMember) {
  return hasImage(m.image) ? (
    <img
      src={asset(m.image)}
      alt={m.portraitLink ? "" : portraitAlt(m)}
      width="560"
      height="560"
      loading="lazy"
      decoding="async"
      style={{ objectPosition: m.objectPosition || "50% 25%" }}
    />
  ) : (
    <span className="member-initials" aria-hidden="true">
      {m.initials}
    </span>
  );
}

/** The seven students. Same card for everyone; the order is not a ranking. */
export function Team() {
  return (
    <section id="team" className="section team-section" aria-labelledby="team-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <p className="eyebrow">The team</p>
          <h2 id="team-title" className="h2">
            Meet the {spellNumber(team.length)}.
          </h2>
          <p className="sub">
            {spellNumber(countries, true)} home countries, one university. Listed in no particular order.
          </p>
        </div>
        <ul className="members">
          {team.map((m, i) => {
            const email = visibleEmail(m, "student");
            return (
              <li key={m.name} className="member" data-reveal style={{ "--i": i % 4 } as React.CSSProperties}>
                {m.portraitLink ? (
                  // Easter egg: only the photo links out, and nothing on the card says so.
                  <a
                    className="member-photo is-egg"
                    href={m.portraitLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${m.name}’s website (opens in a new tab)`}
                  >
                    {portrait(m)}
                  </a>
                ) : (
                  <div className="member-photo">{portrait(m)}</div>
                )}
                <h3>{m.name}</h3>
                {m.location && (
                  <p className="member-place">
                    {m.location}
                    {m.flag && <span aria-hidden="true"> {m.flag}</span>}
                  </p>
                )}
                {m.bio && <p className="member-bio">{m.bio}</p>}
                <div className="member-links">
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer">
                      <LinkedInIcon size={14} />
                      LinkedIn
                      <span className="sr-only"> profile of {m.name} (opens in a new tab)</span>
                    </a>
                  )}
                  {email && <a href={`mailto:${email}`}>{email}</a>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
