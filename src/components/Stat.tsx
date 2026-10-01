import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { pad } from "../lib/text";

interface StatProps {
  value: number;
  label: string;
}

/** A large number that counts up once when it scrolls into view. */
export function Stat({ value, label }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const isStatic = import.meta.env.VITE_STATIC_REVEAL === "1";
  const [shown, setShown] = useState(isStatic ? value : 0);

  useEffect(() => {
    if (!inView || isStatic) return;
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
  }, [inView, isStatic, reduceMotion, value]);

  return (
    <div ref={ref} className="flex flex-col-reverse gap-3 border-t border-ink pt-5 sm:pt-6">
      <dt className="eyebrow text-muted">{label}</dt>
      <dd className="display text-[clamp(3.25rem,11vw,9rem)] leading-[0.82] tabular-nums">
        <span aria-hidden="true">{pad(shown)}</span>
        <span className="sr-only">{value}</span>
      </dd>
    </div>
  );
}
