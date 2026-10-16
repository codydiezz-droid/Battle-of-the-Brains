import { Gallery } from "../components/Gallery";
import { gallery } from "../data/siteData";

export function Photos() {
  return (
    <section id="photos" className="section photos-section" aria-labelledby="photos-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <p className="eyebrow">Photos</p>
          <h2 id="photos-title" className="h2">
            From the week.
          </h2>
          <p className="sub">Taken by our coaches and teammates. Select a photo to see it larger.</p>
        </div>
        <Gallery photos={gallery} />
      </div>
    </section>
  );
}
