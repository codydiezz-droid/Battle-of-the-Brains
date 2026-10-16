import { ArrowUpRight, Download } from "lucide-react";
import { StoryScroll } from "../components/StoryScroll";
import { dashboardImage, event, onebridge, presentation, result } from "../data/siteData";
import { asset, hasFile } from "../lib/images";
import { pad } from "../lib/text";

/** The case study: the problem, how OneBridge works, and how we built it. */
export function OneBridge() {
  return (
    <section id="onebridge" className="ob" aria-labelledby="ob-title">
      <div className="wrap">
        <div className="ob-head" data-reveal>
          <p className="eyebrow eyebrow-ob">What we built in 24 hours</p>
          <h2 id="ob-title" className="h2">
            OneBridge
          </h2>
          <p className="sub">
            The 2026 prompt was “{event.prompt}.” Our answer: {onebridge.lead.charAt(0).toLowerCase()}
            {onebridge.lead.slice(1)}
          </p>
        </div>

        <h3 className="ob-h3" data-reveal>
          The problem, in one story
        </h3>
        <StoryScroll />

        <h3 className="ob-h3" data-reveal>
          How it works
        </h3>
        <ol className="steps" data-line>
          {onebridge.steps.map((s, i) => (
            <li key={s.title} data-reveal style={{ "--i": i } as React.CSSProperties}>
              <span className="step-dot" aria-hidden="true" />
              <span className="step-num">{pad(i + 1)}</span>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="ob-build">
          <div data-reveal>
            <h3 className="ob-h3">How we built it</h3>
            <p className="ob-text">
              The work covered six disciplines, and all of it had to come together as one company, one product, and
              one pitch within 24 hours.
            </p>
            <ul className="chips" aria-label="Disciplines">
              {onebridge.disciplines.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="ob-model-label">Proposed pricing</p>
            <dl className="ob-model">
              <div>
                <dt>One-time setup</dt>
                <dd>{onebridge.pricing.setup}</dd>
              </div>
              <div>
                <dt>Monthly service</dt>
                <dd>
                  {onebridge.pricing.monthly}
                  <span>/month</span>
                </dd>
              </div>
            </dl>
            <p className="ob-result">{result.summary}</p>
            <div className="actions">
              <a className="btn btn-ob" href={onebridge.website} target="_blank" rel="noopener noreferrer">
                Open the OneBridge site
                <ArrowUpRight size={16} aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              {hasFile(presentation.pptx) && (
                <a className="btn btn-quiet" href={asset(presentation.pptx)} download>
                  <Download size={16} aria-hidden="true" />
                  Final pitch deck
                  <span className="btn-note">{presentation.fileNote}</span>
                </a>
              )}
            </div>
          </div>
          <figure className="ob-shot" data-reveal>
            <img
              data-parallax
              src={asset(dashboardImage.src)}
              width={dashboardImage.width}
              height={dashboardImage.height}
              alt={dashboardImage.alt}
              loading="lazy"
              decoding="async"
            />
            <figcaption>The OneBridge dashboard, from our final presentation.</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
