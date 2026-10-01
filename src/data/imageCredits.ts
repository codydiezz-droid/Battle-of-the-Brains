/**
 * Where every photo of a person came from.
 *
 * Add an entry whenever you save a photo that you didn't take yourself, so the
 * team always knows its source. Entries only appear in the footer's small
 * "Photo credits" list once the file exists in /public.
 *
 * Rules we follow for photos of people:
 *   • Only use a photo when the source clearly identifies that exact person.
 *   • Prefer official Southwestern University pages or a photo the person sent.
 *   • Never guess from a group photo, search results, or social media.
 *   • Never use AI-generated faces.
 */

export interface ImageCredit {
  /** Who is in the photo. */
  person: string;
  /** Local file path inside /public. */
  file: string;
  /** Name of the page or organization the photo came from. */
  source: string;
  sourceUrl: string;
  /** Leave "" if the source doesn't name a photographer. */
  photographer: string;
  usageNotes: string;
}

// Portraits of Asin, Emma, Alyanna, Elias, Juan and Cody were provided directly
// by the team, so they need no outside credit.
export const imageCredits: ImageCredit[] = [
  {
    person: "Jade Cindy Foka",
    file: "/images/team/jade-foka.jpg",
    source: "Southwestern University News",
    sourceUrl: "https://www.southwestern.edu/live/news/17394-jade-cindy-foka-28-becomes-third-student-in",
    photographer: "",
    usageNotes: "Portrait from an official Southwestern University feature about Jade.",
  },
  {
    person: "Dr. Debika Sihi",
    file: "/images/coaches/debika-sihi.jpg",
    source: "Southwestern University faculty/staff profile",
    sourceUrl: "https://www.southwestern.edu/live/profiles/25848-debika-sihi",
    photographer: "",
    usageNotes: "Official Southwestern University profile headshot.",
  },
  {
    person: "Abby Dings",
    file: "/images/coaches/abby-dings.jpg",
    source: "Southwestern University faculty/staff profile",
    sourceUrl: "https://www.southwestern.edu/live/profiles/25780-abby-dings",
    photographer: "",
    usageNotes: "Official Southwestern University profile headshot.",
  },
];
