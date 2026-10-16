import { CheckCircle2, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { onebridge } from "../data/siteData";

const QUESTION = "Where can I get a front brake rotor for a 2015 Civic today?";

function Screen({ step }: { step: number }) {
  return (
    <div className="phone" data-step={step}>
      <div className="phone-bar">
        <span>{step === 2 ? "Jorge’s Auto Parts · inventory" : "AI assistant"}</span>
      </div>
      <div className="phone-body">
        {step === 2 ? (
          <div className="sheet">
            <div className="sheet-row sheet-head">
              <span>Item</span>
              <span>Price</span>
              <span>In stock</span>
            </div>
            <div className="sheet-row">
              <span>Front brake rotor, 2015 to 2020 Civic</span>
              <span>$49.99</span>
              <span>Yes</span>
            </div>
            <div className="sheet-row">
              <span>Ceramic brake pad set</span>
              <span>$34.99</span>
              <span>Yes</span>
            </div>
            <div className="sheet-row">
              <span>Cabin air filter</span>
              <span>$12.99</span>
              <span>Yes</span>
            </div>
            <p className="sheet-flag">
              <EyeOff size={14} aria-hidden="true" /> Not visible to AI assistants
            </p>
          </div>
        ) : (
          <div className="thread">
            <p className="msg msg-me">{QUESTION}</p>
            {step === 0 && (
              <p className="msg msg-typing">
                <i />
                <i />
                <i />
              </p>
            )}
            {step === 1 && (
              <p className="msg msg-ai">Your best bet is a big chain store across town. Smaller shops may not carry it.</p>
            )}
            {step === 3 && (
              <>
                <p className="msg msg-ai msg-good">
                  Jorge’s Auto Parts, two blocks away, has one in stock for $49.99. They’re open until 6 PM.
                </p>
                <p className="msg-source">
                  <CheckCircle2 size={14} aria-hidden="true" /> Approved by the store, via OneBridge
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The problem OneBridge solves, told as a four-beat story. On wide screens
 * the phone stays pinned while the beats scroll past; on phones each beat
 * shows its own screen inline.
 */
export function StoryScroll() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.beat));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="story">
      <ol className="beats">
        {onebridge.story.map((b, i) => (
          <li
            key={b.kicker}
            data-beat={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={i === active ? "beat is-active" : "beat"}
          >
            <p className="beat-kicker">{b.kicker}</p>
            <h4>{b.title}</h4>
            <p>{b.body}</p>
            {b.sr && <p className="sr-only">{b.sr}</p>}
            <div className="beat-inline" aria-hidden="true">
              <Screen step={i} />
            </div>
          </li>
        ))}
      </ol>
      <div className="story-stage" aria-hidden="true">
        <div className="story-pin">
          <Screen step={active} />
          <p className={active === 3 ? "stage-note is-shown" : "stage-note"}>
            Shown with an assistant connected to Jorge’s OneBridge feed.
          </p>
        </div>
      </div>
    </div>
  );
}
