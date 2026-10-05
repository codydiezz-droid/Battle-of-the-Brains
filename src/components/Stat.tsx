import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Metric } from "../data/types";

/** A large figure that counts up once when it scrolls into view. Text values (e.g. "Finalist") are shown as is. */
export function Stat({ value, suffix = "", label }: Metric) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const isNumber = typeof value === "number";
  const isStatic = import.meta.env.VITE_STATIC_REVEAL === "1" || !isNumber;
  const [shown, setShown] = useState(isStatic ? value : 0);

  useEffect(() => {
    if (!inView || isStatic || !isNumber) return;
    if (reduceMotion) {
      setShown(value);
      return;
    }
    // A small requestAnimationFrame tween with an ease-out curve.
    const duration = 1600;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 4))));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [inView, isNumber, isStatic, reduceMotion, value]);

  return (
    <div ref={ref} className="flex flex-col-reverse gap-3 border-t border-cream/25 pt-5 sm:pt-6">
      <dt className="eyebrow text-muted-dark">{label}</dt>
      <dd
        className={
          // Same height for numbers and words, so every figure sits on one baseline.
          isNumber
            ? "display flex h-[calc(clamp(3rem,8vw,5.25rem)*0.85)] items-end text-[clamp(3rem,8vw,5.25rem)] leading-[0.85] tabular-nums"
            : "display flex h-[calc(clamp(3rem,8vw,5.25rem)*0.85)] items-end text-[clamp(2rem,6vw,3.6rem)] leading-[0.85] text-gold"
        }
      >
        <span aria-hidden="true">
          {shown}
          {suffix && <span className="text-gold normal-case">{suffix}</span>}
        </span>
        <span className="sr-only">
          {value}
          {suffix}
        </span>
      </dd>
    </div>
  );
}
