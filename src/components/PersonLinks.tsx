import { ArrowUpRight, Mail } from "lucide-react";
import type { Coach, Person } from "../data/types";
import { cx } from "../lib/cx";
import { displayName, visibleEmail } from "../lib/people";
import { LinkedInIcon } from "./Icons";

interface PersonLinksProps {
  person: Person | Coach;
  kind: "student" | "coach";
  className?: string;
}

/** LinkedIn, personal website, email (only when allowed by settings) and official profile links. Renders nothing if none exist. */
export function PersonLinks({ person, kind, className }: PersonLinksProps) {
  const email = visibleEmail(person, kind);
  const profileUrl = "profileUrl" in person ? person.profileUrl : undefined;
  const name = displayName(person);

  if (!person.linkedin && !person.website && !email && !profileUrl) return null;

  const link =
    "inline-flex items-center gap-1.5 text-[0.78rem] font-medium uppercase tracking-[0.12em] underline-offset-4 hover:underline";

  return (
    <ul className={cx("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {person.linkedin && (
        <li>
          <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className={link}>
            <LinkedInIcon className="h-3.5 w-3.5" />
            LinkedIn
            <span className="sr-only">: {name} (opens in a new tab)</span>
          </a>
        </li>
      )}
      {person.website && (
        <li>
          <a href={person.website} target="_blank" rel="noopener noreferrer" className={link}>
            Website
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">: {name} (opens in a new tab)</span>
          </a>
        </li>
      )}
      {email && (
        <li>
          <a href={`mailto:${email}`} className={link}>
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Email
            <span className="sr-only"> {name}</span>
          </a>
        </li>
      )}
      {profileUrl && (
        <li>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className={link}>
            Southwestern profile
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">: {name} (opens in a new tab)</span>
          </a>
        </li>
      )}
    </ul>
  );
}
