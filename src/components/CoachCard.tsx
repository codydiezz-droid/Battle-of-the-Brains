import type { Coach } from "../data/types";
import { displayName } from "../lib/people";
import { PersonLinks } from "./PersonLinks";
import { Portrait } from "./Portrait";

interface CoachCardProps {
  coach: Coach;
  index: number;
}

export function CoachCard({ coach, index }: CoachCardProps) {
  const subtitle = [coach.role, coach.title].filter(Boolean).join(" · ");

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <div className="h-full w-full transition-transform duration-[1200ms] ease-calm group-hover:scale-[1.03]">
          {/* Offset the tone so coach placeholders don't mirror the student grid. */}
          <Portrait person={coach} tone={index + 1} />
        </div>
      </div>
      <div aria-hidden="true" className="relative mt-5 h-[2px] bg-ink/10">
        <span className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-700 ease-calm group-hover:scale-x-100" />
      </div>
      <h3 className="mt-4 font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.01em] sm:text-[1.7rem]">
        {displayName(coach)}
      </h3>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      {coach.department && <p className="mt-1 text-sm text-ink/80">{coach.department}</p>}
      {coach.bio && <p className="mt-4 max-w-prose text-[0.98rem] leading-relaxed text-ink/80">{coach.bio}</p>}
      <PersonLinks person={coach} kind="coach" className="mt-5" />
    </article>
  );
}
