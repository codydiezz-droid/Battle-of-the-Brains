import { m, type HTMLMotionProps } from "framer-motion";
import { easeCalm, enter } from "../lib/motion";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  /** Distance in px the content rises while fading in. */
  y?: number;
};

/** Fades content in with a small upward movement the first time it scrolls into view. */
export function Reveal({ delay = 0, y = 18, children, ...rest }: RevealProps) {
  return (
    <m.div
      initial={enter({ opacity: 0, y })}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: easeCalm, delay }}
      {...rest}
    >
      {children}
    </m.div>
  );
}
