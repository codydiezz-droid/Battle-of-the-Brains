import type { Coach, Person } from "../data/types";
import { cx } from "../lib/cx";
import { asset, hasImage, positionStyle } from "../lib/images";
import { portraitAlt } from "../lib/people";

const tones = ["bg-ink-soft", "bg-green", "bg-espresso"] as const;

interface PortraitProps {
  person: Person | Coach;
  /** Picks the placeholder colour so neighbouring placeholders differ. */
  tone?: number;
  className?: string;
  imgClassName?: string;
  /** Load immediately instead of lazily (only for images visible on first paint). */
  eager?: boolean;
  /** "compact" centres the initials — use it for small or round frames. */
  variant?: "full" | "compact";
}

/**
 * A person's photo, or — when no approved photo exists yet — an intentional
 * monogram with their initials. Fills its parent; give the parent a size.
 */
export function Portrait({
  person,
  tone = 0,
  className,
  imgClassName,
  eager = false,
  variant = "full",
}: PortraitProps) {
  if (hasImage(person.image)) {
    return (
      <img
        src={asset(person.image)}
        alt={portraitAlt(person)}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={cx("img-position h-full w-full object-cover", imgClassName, className)}
        style={positionStyle(person.objectPosition, "50% 25%")}
      />
    );
  }

  // Decorative: the person's name is always printed right next to it.
  if (variant === "compact") {
    return (
      <div
        aria-hidden="true"
        className={cx(
          "@container flex h-full w-full items-center justify-center text-cream",
          tones[tone % tones.length],
          className,
        )}
      >
        <span className="display text-[36cqw] leading-none tracking-[-0.01em]">{person.initials}</span>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cx(
        "grain-light @container relative flex h-full w-full flex-col justify-between overflow-hidden text-cream",
        tones[tone % tones.length],
        className,
      )}
    >
      <span className="m-[8cqw] block h-px w-[14cqw] bg-gold" />
      <span
        className={cx(
          "display m-[7cqw] block text-[38cqw] leading-[0.8] tracking-[-0.02em] text-cream/95",
          imgClassName,
        )}
      >
        {person.initials}
      </span>
    </div>
  );
}
