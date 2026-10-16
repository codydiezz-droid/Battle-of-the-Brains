import { event, groupPhoto, team } from "../data/siteData";
import { photoSmall, photoSrcSet } from "../lib/images";

const countries = new Set(team.map((m) => m.country)).size;

const facts = [
  { value: "1st", label: "Place for business solution" },
  { value: "Finalist", label: "Presented in the final round" },
  { value: "24", label: "Hours to build a company" },
  { value: String(team.length), label: `Students from ${countries} countries` },
  { value: String(event.yearsParticipating) + (event.yearsParticipating === 2 ? "nd" : "th"), label: "Year for Southwestern" },
];

/** The group photo, full width with a slow parallax, then the result in five facts. */
export function Group() {
  return (
    <section className="group" aria-label="The team at a glance">
      <figure className="group-photo">
        <div className="group-photo-frame">
          <img
            data-parallax
            src={photoSmall(groupPhoto)}
            srcSet={photoSrcSet(groupPhoto)}
            sizes="100vw"
            width={groupPhoto.width}
            height={groupPhoto.height}
            alt={groupPhoto.alt}
            fetchPriority="high"
          />
        </div>
        <figcaption className="wrap">{groupPhoto.caption}</figcaption>
      </figure>
      <div className="wrap">
        <dl className="facts" data-reveal>
          {facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
