import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { event } from "../data/siteData";
import type { TeamMember } from "../data/types";
import { Dialog } from "./Dialog";
import { PersonLinks } from "./PersonLinks";
import { Portrait } from "./Portrait";
import { formatYear } from "./TeamMember";

interface ProfileDialogProps {
  members: TeamMember[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/** A closer look at one teammate. Only fields that have been filled in are shown. */
export function ProfileDialog({ members, index, onClose, onNavigate }: ProfileDialogProps) {
  const member = index === null ? null : members[index];
  const count = members.length;

  return (
    <Dialog open={member !== null} onClose={onClose} labelledBy="profile-name">
      {member && index !== null && (
        <ProfileContent
          member={member}
          tone={index}
          prev={members[(index - 1 + count) % count]}
          next={members[(index + 1) % count]}
          onPrev={() => onNavigate((index - 1 + count) % count)}
          onNext={() => onNavigate((index + 1) % count)}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

interface ProfileContentProps {
  member: TeamMember;
  tone: number;
  prev: TeamMember;
  next: TeamMember;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

function ProfileContent({ member, tone, prev, next, onPrev, onNext, onClose }: ProfileContentProps) {
  const facts = [
    ["Major", member.major],
    ["Minor", member.minor],
    ["Class", member.classYear && formatYear(member.classYear)],
    ["Hometown", member.hometown],
    ["Role", member.role],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  const hasStory = facts.length > 0 || member.bio || member.personalQuote;

  return (
    <div className="grid max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100vw-2rem))] grid-rows-[auto_1fr] overflow-y-auto bg-cream text-ink md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:grid-rows-1">
      <div className="aspect-[4/3] md:aspect-auto md:min-h-[34rem]">
        <Portrait person={member} tone={tone} eager soft />
      </div>

      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <p className="eyebrow flex items-center gap-3 text-muted">
            <span aria-hidden="true" className="h-px w-8 bg-gold" />
            The Seven
          </p>
          <button
            type="button"
            onClick={onClose}
            className="-mt-2 -mr-2 inline-flex h-10 w-10 items-center justify-center hover:bg-sand"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Close profile</span>
          </button>
        </div>

        <h2 id="profile-name" className="display mt-6 text-[clamp(2.2rem,5vw,3.4rem)]">
          {member.name}
        </h2>
        <p className="mt-3 text-muted">{event.school}</p>

        {facts.length > 0 && (
          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-ink/10 pt-6 text-[0.95rem]">
            {facts.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="eyebrow pt-1 text-muted">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {member.bio && <p className="mt-6 text-[1.05rem] leading-relaxed text-ink/85">{member.bio}</p>}

        {member.personalQuote && (
          <blockquote className="mt-6 border-l-2 border-gold pl-5 font-serif text-[1.35rem] leading-snug italic">
            “{member.personalQuote}”
          </blockquote>
        )}

        {!hasStory && (
          <p className="mt-8 border-t border-ink/10 pt-6 text-[1.05rem] leading-relaxed text-ink/80">
            One of seven students representing {event.school} at the {event.year} {event.name}.
          </p>
        )}

        <PersonLinks person={member} kind="student" className="mt-6" />

        <div className="mt-auto pt-10">
          <div className="flex items-center justify-between gap-4 border-t border-ink/10 pt-6 text-sm">
            <button type="button" onClick={onPrev} className="group inline-flex items-center gap-2 py-2 font-medium">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              <span className="sr-only">Previous: </span>
              {prev.firstName}
            </button>
            <button type="button" onClick={onNext} className="group inline-flex items-center gap-2 py-2 font-medium">
              <span className="sr-only">Next: </span>
              {next.firstName}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
