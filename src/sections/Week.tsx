import { PhotoFigure } from "../components/PhotoFigure";
import { event, week } from "../data/siteData";
import { pad } from "../lib/text";

/** The week as a timeline. The line draws itself as you scroll. */
export function Week() {
  return (
    <section id="week" className="section week-section" aria-labelledby="week-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <p className="eyebrow">{event.dates}</p>
          <h2 id="week-title" className="h2">
            The week, in order.
          </h2>
        </div>
        <ol className="week" data-line>
          {week.map((step, i) => (
            <li key={step.title} className="week-step">
              <span className="week-dot" aria-hidden="true" />
              <div className="week-text" data-reveal>
                <span className="week-num">{pad(i + 1)}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
              <div className={step.photos.length > 1 ? "week-photos is-pair" : "week-photos"} data-reveal>
                {step.photos.map((photo) => (
                  <PhotoFigure
                    key={photo.src}
                    photo={photo}
                    sizes="(min-width: 960px) 30vw, 90vw"
                    className={photo.height > photo.width ? "is-tall" : undefined}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
