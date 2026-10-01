import { settings } from "../data/siteData";
import type { Coach, Person } from "../data/types";

export function displayName(person: Person | Coach): string {
  return "honorific" in person && person.honorific ? `${person.honorific} ${person.name}` : person.name;
}

export function portraitAlt(person: Person | Coach): string {
  return person.imageAlt || `Portrait of ${displayName(person)}`;
}

/** Returns the address only when the matching privacy setting allows it. */
export function visibleEmail(person: Person, kind: "student" | "coach"): string | undefined {
  const allowed = kind === "student" ? settings.showStudentEmails : settings.showCoachEmails;
  return allowed && person.email ? person.email : undefined;
}
