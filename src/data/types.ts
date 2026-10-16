/**
 * Shapes for everything in siteData.ts.
 * Every field marked with `?` is optional: leave it out (or as "") and the
 * layout adapts. Nothing is ever shown that you haven't written yourself.
 */

/** CSS object-position, e.g. "50% 30%". Controls which part of a photo stays visible when it is cropped. */
export type ObjectPosition = string;

export interface Person {
  /** Full name, exactly as it should appear on the site. */
  name: string;
  firstName: string;
  /** Shown in the placeholder when there is no photo yet. */
  initials: string;
  /** Kept here for internal use. Only rendered when the matching show…Emails setting is true. */
  email?: string;
  /** Path to a photo inside /public, e.g. "/images/team/emma-sanchez.png". */
  image?: string;
  /** Optional custom alt text. Defaults to "Portrait of <name>". */
  imageAlt?: string;
  /** Which part of the portrait stays visible when cropped. Defaults to "50% 25%". */
  objectPosition?: ObjectPosition;
  linkedin?: string;
  website?: string;
  bio?: string;
  role?: string;
}

export interface TeamMember extends Person {
  major?: string;
  classYear?: string;
  hometown?: string;
  /** Shown under the name, e.g. "Mexico City, Mexico". Only what the person shared. */
  location?: string;
  /** Flag emoji shown after the location, e.g. "🇲🇽". */
  flag?: string;
  /** The country, used to count how many countries the team comes from. */
  country: string;
  /**
   * A hidden link on the portrait only (an Easter egg). Nothing on the card
   * advertises it; clicking the photo opens this address in a new tab.
   */
  portraitLink?: string;
}

export interface Coach extends Person {
  /** e.g. "Dr.", shown before the name. */
  honorific?: string;
  /** Official job title. Leave "" until confirmed. */
  title?: string;
  /** Link to an official Southwestern University profile page. */
  profileUrl?: string;
}

/** An event photo. Every photo has a small (800px) and a large (1600px) WebP. */
export interface Photo {
  /** Base path without the size suffix, e.g. "/images/event/all-done" for all-done-800.webp and all-done-1600.webp. */
  src: string;
  width: number;
  height: number;
  /** What is happening, for people using screen readers. */
  alt: string;
  caption: string;
}

export interface WeekStep {
  title: string;
  body: string;
  photos: Photo[];
}

export interface StoryBeat {
  kicker: string;
  title: string;
  body: string;
  /** What the illustrated screen says, for screen readers. */
  sr?: string;
}

export interface Step {
  title: string;
  body: string;
}

export interface Presentation {
  /** Path to the deck inside /public. */
  pptx: string;
  fileNote: string;
}
