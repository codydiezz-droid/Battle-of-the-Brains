import type { TeamMember as Member } from "../data/types";
import { event } from "../data/siteData";
import { PersonLinks } from "./PersonLinks";
import { Portrait } from "./Portrait";

interface TeamMemberProps {
  member: Member;
  index: number;
  onOpen: () => void;
}

/**
 * One of the seven. Every portrait is the same size — no one is ranked.
 * The whole card opens the profile; the name button carries the accessible label.
 */
export function TeamMember({ member, index, onOpen }: TeamMemberProps) {
  const details = [member.major, member.classYear && formatYear(member.classYear)].filter(Boolean).join(" · ");

  return (
    <article className="group relative flex flex-col items-center text-center">
      {/* Thin gold ring around a circular portrait. */}
      <div className="w-full max-w-[17rem] rounded-full border border-gold/60 p-1.5 transition-colors duration-500 group-hover:border-gold group-has-[button:focus-visible]:border-gold sm:p-2">
        <div className="relative aspect-square overflow-hidden rounded-full bg-sand outline-offset-4 group-has-[button:focus-visible]:outline-2 group-has-[button:focus-visible]:outline-solid group-has-[button:focus-visible]:outline-gold-deep">
          {/* Slight base zoom trims the dark edge some source photos have around their circle. */}
          <div className="h-full w-full scale-[1.08] transition-transform duration-[1200ms] ease-calm group-hover:scale-[1.11] group-has-[button:focus-visible]:scale-[1.11]">
            <Portrait person={member} tone={index} variant="compact" soft />
          </div>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="mt-5 block h-[2px] w-10 origin-center scale-x-0 bg-gold transition-transform duration-700 ease-calm group-hover:scale-x-100 group-has-[button:focus-visible]:scale-x-100"
      />

      <h3 className="mt-4 font-display text-[1.1rem] font-semibold leading-[1.2] tracking-[-0.01em] text-balance text-ink/80 transition-colors duration-500 group-hover:text-ink group-has-[button:focus-visible]:text-ink sm:text-[1.25rem]">
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >
          {member.name}
          <span className="sr-only">, open profile</span>
        </button>
      </h3>
      <p className="mt-1 text-sm text-muted">{event.school}</p>
      {details && <p className="mt-1 text-sm text-ink/80">{details}</p>}
      {member.bio && <p className="mt-3 line-clamp-2 text-[0.95rem] leading-relaxed text-ink/80">{member.bio}</p>}
      <PersonLinks person={member} kind="student" className="relative z-10 mt-4 justify-center" />
    </article>
  );
}

export function formatYear(classYear: string): string {
  return /^\d{4}$/.test(classYear.trim()) ? `Class of ${classYear.trim()}` : classYear;
}
