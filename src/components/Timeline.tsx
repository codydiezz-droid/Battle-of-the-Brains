import { m, useReducedMotion, useScroll } from "framer-motion";
import { useRef } from "react";
import type { JourneyStep } from "../data/types";
import { cx } from "../lib/cx";
import { asset, hasImage } from "../lib/images";
import { easeCalm, enter } from "../lib/motion";
import { pad } from "../lib/text";

interface TimelineProps {
  steps: JourneyStep[];
}

/**
 * Vertical timeline. On large screens steps alternate sides, with a large
 * outlined numeral facing each step. A gold line fills in as you scroll.
 */
export function Timeline({ steps }: TimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 65%"] });

  return (
    <div ref={ref} className="relative">
      <div aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-px bg-ink/15 lg:left-1/2">
        <m.div
          className="absolute inset-y-0 -left-px w-[3px] origin-top bg-gold"
          style={{ scaleY: reduceMotion ? 1 : scrollYProgress }}
        />
      </div>

      <ol className="space-y-16 sm:space-y-20 lg:space-y-28">
        {steps.map((step, i) => {
          const flip = i % 2 === 1;
          const showImage = hasImage(step.image);
          return (
            <li key={step.title} className="relative grid pl-10 lg:grid-cols-2 lg:gap-x-28 lg:pl-0">
              <m.span
                aria-hidden="true"
                className="absolute top-3 left-0 h-[15px] w-[15px] rounded-full border-2 border-ink lg:top-8 lg:left-1/2 lg:-translate-x-1/2"
                initial={enter({ backgroundColor: "#f6f2e9" })}
                whileInView={{ backgroundColor: "#f4b41a" }}
                viewport={{ once: true, margin: "0px 0px -35% 0px" }}
                transition={{ duration: 0.6, ease: easeCalm }}
              />

              <m.div
                aria-hidden="true"
                className={cx(
                  "display numeral-outline text-[clamp(3.5rem,9vw,8.5rem)] leading-[0.85] select-none",
                  flip ? "lg:order-2 lg:justify-self-start" : "lg:justify-self-end",
                )}
                initial={enter({ opacity: 0 })}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1, ease: easeCalm }}
              >
                {pad(i + 1)}
              </m.div>

              <m.div
                className={cx(
                  "mt-4 max-w-md lg:mt-6",
                  flip ? "lg:order-1 lg:justify-self-end" : "lg:justify-self-start",
                )}
                initial={enter({ opacity: 0, y: 16 })}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.9, ease: easeCalm, delay: 0.08 }}
              >
                {step.date && <p className="eyebrow mb-3 text-gold-deep">{step.date}</p>}
                <h3 className="display text-[clamp(1.9rem,3.6vw,3.1rem)]">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                {step.description && (
                  <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/75 sm:text-lg">{step.description}</p>
                )}
                {showImage && (
                  <div className="mt-6 aspect-[4/3] overflow-hidden bg-sand">
                    <img
                      src={asset(step.image!)}
                      alt={step.imageAlt ?? ""}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </m.div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
