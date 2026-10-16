import { ArrowUpRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { finalVideo } from "../data/siteData";
import { photoSmall, photoSrcSet } from "../lib/images";

// youtube-nocookie: YouTube's privacy-enhanced player, which sets no tracking
// cookies until the video plays. Autoplay starts it right after the poster click.
const embedUrl = `https://www.youtube-nocookie.com/embed/${finalVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
const watchUrl = `https://youtu.be/${finalVideo.youtubeId}`;

/**
 * The recording of our final-round presentation. A poster stands in for the
 * player until someone presses play, so YouTube loads nothing for visitors who
 * never watch.
 */
export function FinalPresentation() {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  // The poster button disappears on play; keep keyboard focus with the player.
  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);
  const poster = finalVideo.poster;

  return (
    <section id="presentation" className="section final" aria-labelledby="final-title">
      <div className="wrap">
        <div className="final-head" data-reveal>
          <div>
            <p className="eyebrow eyebrow-dark">The final round</p>
            <h2 id="final-title" className="h2">
              Our final presentation.
            </h2>
            <p className="sub">
              The pitch the judges saw on the final stage, followed by their questions and our answers.
            </p>
          </div>
          <dl className="final-meta">
            <div>
              <dt>Pitch</dt>
              <dd>{finalVideo.pitch}</dd>
            </div>
            <div>
              <dt>Judges’ Q&amp;A</dt>
              <dd>{finalVideo.questions}</dd>
            </div>
          </dl>
        </div>

        <div className="final-player" data-reveal>
          {playing ? (
            <iframe
              ref={frameRef}
              src={embedUrl}
              title={finalVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <button type="button" className="final-poster" onClick={() => setPlaying(true)}>
              <img
                src={photoSmall(poster)}
                srcSet={photoSrcSet(poster)}
                sizes="(min-width: 1180px) 1180px, 100vw"
                width={poster.width}
                height={poster.height}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className="final-play" aria-hidden="true">
                <Play size={30} fill="currentColor" />
              </span>
              <span className="final-label">
                Play the final presentation
                <span className="final-length">{finalVideo.total}</span>
              </span>
            </button>
          )}
        </div>

        <p className="final-foot">
          <span>{finalVideo.credit}</span>
          <a href={watchUrl} target="_blank" rel="noopener noreferrer">
            Watch on YouTube
            <ArrowUpRight size={15} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </section>
  );
}
