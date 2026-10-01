import { ArrowUpRight } from "lucide-react";
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
 * One of the seven. Every card is identical in size — no one is ranked.
 * The whole card opens the profile; the name button carries the accessible label.
 */
export function TeamMember({ member, index, onOpen }: TeamMemberProps) {
  const details = [member.major, member.classYear && formatYear(member.classYear)].filter(Boolean).join(" · ");

  return (
    <article className="group relative outline-offset-[6px] has-[button:focus-visible]:outline-2 has-[button:focus-visible]:outline-gold-deep has-[button:focus-visible]:outline-solid">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <div className="h-full w-full transition-transform duration-[1200ms] ease-calm group-hover:scale-[1.04] group-has-[button:focus-visible]:scale-[1.04]">
          <Portrait person={member} tone={index} />
        </div>
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-3 inline-flex translate-y-2 items-center gap-1 bg-cream px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink opacity-0 transition-all duration-500 ease-calm group-hover:translate-y-0 group-hover:opacity-100 group-has-[button:focus-visible]:translate-y-0 group-has-[button:focus-visible]:opacity-100"
        >
          Meet {member.firstName}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>

      <div aria-hidden="true" className="relative mt-4 h-[2px] bg-ink/10">
        <span className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-700 ease-calm group-hover:scale-x-100 group-has-[button:focus-visible]:scale-x-100" />
      </div>

      <h3 className="mt-4 font-display text-[1.2rem] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[1.35rem]">
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >
          {member.name}
          <span className="sr-only">, open profile</span>
        </button>
      </h3>
      <p className="mt-1 text-sm text-muted">{event.school}</p>
      {details && <p className="mt-1 text-sm text-ink/80">{details}</p>}
      {member.bio && <p className="mt-3 line-clamp-2 text-[0.95rem] leading-relaxed text-ink/80">{member.bio}</p>}
      <PersonLinks person={member} kind="student" className="relative z-10 mt-4" />
    </article>
  );
}

export function formatYear(classYear: string): string {
  return /^\d{4}$/.test(classYear.trim()) ? `Class of ${classYear.trim()}` : classYear;
}
