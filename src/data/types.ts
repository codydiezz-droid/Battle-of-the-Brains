/**
 * Shapes for everything in siteData.ts.
 * Every field marked with `?` is optional — leave it out (or as "") and the
 * layout adapts. Nothing is ever shown that you haven't written yourself.
 */

/** CSS object-position, e.g. "50% 30%" or "center top". Controls which part of a photo stays visible when it is cropped. */
export type ObjectPosition = string;

export interface ResponsivePosition {
  /** Used on phones (below 768px wide). */
  mobile?: ObjectPosition;
  /** Used on tablets and desktops. */
  desktop?: ObjectPosition;
}

export interface Person {
  /** Full name, exactly as it should appear on the site. */
  name: string;
  /** Used for labels such as "Meet Emma". */
  firstName: string;
  /** Shown in the placeholder when there is no photo yet. */
  initials: string;
  /** Kept here for internal use. Only rendered when the matching show…Emails setting is true. */
  email?: string;
  /** Path to a photo inside /public, e.g. "/images/team/emma-sanchez.jpg". If the file doesn't exist yet, the initials placeholder is shown. */
  image?: string;
  /** Optional custom alt text. Defaults to "Portrait of <name>". */
  imageAlt?: string;
  /** Which part of the portrait stays visible when cropped. Defaults to "50% 25%" (keeps faces near the top). */
  objectPosition?: ObjectPosition | ResponsivePosition;
  /** Full LinkedIn URL, e.g. "https://www.linkedin.com/in/your-name/". */
  linkedin?: string;
  /** Full URL of a personal website, e.g. "https://example.com/". */
  website?: string;
  bio?: string;
  role?: string;
}

export interface TeamMember extends Person {
  major?: string;
  minor?: string;
  /** e.g. "2027" or "Class of 2027" */
  classYear?: string;
  hometown?: string;
  /** Shown under the name on the team card, e.g. "Mexico City, Mexico". Only what the person shared — no guessed cities. */
  location?: string;
  /** Flag emoji shown after the location, e.g. "🇲🇽". */
  flag?: string;
  /** A short line in the student's own words. */
  personalQuote?: string;
}

export interface Coach extends Person {
  /** e.g. "Dr." — shown before the name. */
  honorific?: string;
  /** Official job title, e.g. "Associate Professor of …". */
  title?: string;
  department?: string;
  /** Link to an official Southwestern University profile page. */
  profileUrl?: string;
}

export interface JourneyStep {
  title: string;
  description?: string;
  /** Optional small label such as a date: "Sept. 28 – Oct. 2". */
  date?: string;
  /** Optional photo from this stage, e.g. "/images/journey/brainstorming.jpg". */
  image?: string;
  imageAlt?: string;
}

export const galleryCategories = [
  "Competition",
  "Working Sessions",
  "Pitch Practice",
  "Travel",
  "Team",
  "Behind the Scenes",
] as const;

export type GalleryCategory = (typeof galleryCategories)[number];

export interface GalleryImage {
  /** e.g. "/images/gallery/working-session-1.jpg" */
  src: string;
  /** Describe what is happening in the photo for people using screen readers. */
  alt: string;
  category: GalleryCategory;
  /** A short caption shown under the photo and in the lightbox. */
  caption?: string;
}

export interface OneBridgeStep {
  title: string;
  description: string;
}

export interface Project {
  /** Small label above the section, e.g. "Built during the 2026 HSI Battle of the Brains". */
  label: string;
  name: string;
  tagline: string;
  intro: string;
  steps: OneBridgeStep[];
}

export interface Presentation {
  /** Path to the original deck inside /public, e.g. "/presentation/SU-OneBridge-Final-Pitch.pptx". */
  pptx: string;
  /** Optional PDF copy for viewing in the browser. Shown only when the file exists. */
  pdf?: string;
  /** Optional OneBridge logo taken from the deck. */
  logo?: string;
  logoAlt?: string;
  /** Optional image from the deck shown beside the buttons. */
  preview?: string;
  previewAlt?: string;
  /** Small note under the buttons, e.g. "PowerPoint · 34 MB". */
  fileNote?: string;
  summary: string;
}

export interface Metric {
  /** A number counts up when it scrolls into view; text is shown as is. */
  value: number | string;
  /** Text after a number, e.g. "st" in "1st". */
  suffix?: string;
  label: string;
}

export interface FeatureImage {
  src: string;
  alt: string;
  /** Optional caption shown under the image. */
  caption?: string;
  /**
   * Optional crop, e.g. { mobile: "4 / 3" }. Leave out to show the whole
   * photo at its natural shape (nobody gets cropped out).
   */
  aspectRatio?: { mobile?: string; desktop?: string };
  /** Which part of the photo stays visible when it is cropped. */
  objectPosition?: ResponsivePosition;
}
