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
    <article className="group flex flex-col items-center text-center">
      {/* Same circular portrait with a thin gold ring as the student cards. */}
      <div className="w-full max-w-[18rem] rounded-full border border-gold/60 p-1.5 transition-colors duration-500 group-hover:border-gold sm:p-2">
        <div className="aspect-square overflow-hidden rounded-full bg-sand">
          <div className="h-full w-full scale-[1.08] transition-transform duration-[1200ms] ease-calm group-hover:scale-[1.11]">
            {/* Offset the tone so coach placeholders don't mirror the student grid. */}
            <Portrait person={coach} tone={index + 1} variant="compact" soft />
          </div>
        </div>
      </div>
      <span
        aria-hidden="true"
        className="mt-5 block h-[2px] w-10 origin-center scale-x-0 bg-gold transition-transform duration-700 ease-calm group-hover:scale-x-100"
      />
      <h3 className="mt-4 font-display text-[1.4rem] font-semibold leading-tight tracking-[-0.01em] sm:text-[1.6rem]">
        {displayName(coach)}
      </h3>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      {coach.department && <p className="mt-1 text-sm text-ink/80">{coach.department}</p>}
      {coach.bio && <p className="mt-4 max-w-prose text-[0.98rem] leading-relaxed text-ink/80">{coach.bio}</p>}
      <PersonLinks person={coach} kind="coach" className="mt-5 justify-center" />
    </article>
  );
}
