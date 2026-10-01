/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE DATA — the one file to edit.
 *
 *  Every name, email, photo path, bio, journey step, gallery photo and project
 *  detail on the website comes from here. Components never hardcode people.
 *
 *  Rules of thumb
 *   • Optional fields can be left as "" (or deleted) — the layout adapts.
 *   • Only add information the person has shared or approved. Never guess.
 *   • Photo paths start with "/images/…" and point inside the /public folder.
 *     If a file doesn't exist yet, a placeholder with initials is shown.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { Coach, FeatureImage, GalleryImage, JourneyStep, Project, TeamMember } from "./types";

/* ───────────────────────────── Settings ───────────────────────────── */

export const settings = {
  /**
   * Email privacy. When false, no email address is rendered anywhere on the page.
   * (They still live in this file, so anyone reading the repository can see them.)
   */
  showStudentEmails: false,
  showCoachEmails: false,

  /** Link for the GitHub icon in the footer. Set to "" to hide it. */
  githubUrl: "https://github.com/codydiezz-droid/Battle-of-the-Brains",

  /** Optional general contact address for the footer. Leave "" to hide. */
  contactEmail: "",
};

/* ────────────────────────────── Event ─────────────────────────────── */

export const event = {
  name: "HSI Battle of the Brains",
  year: 2026,
  dates: "September 28 – October 2, 2026",
  datesShort: "September 28 – October 2",
  school: "Southwestern University",
  location: "Georgetown, Texas",
  participation: "Second-Year Participant",
  /** Used for the "Years at BOTB" statistic. */
  yearsParticipating: 2,
};

/* ───────────────────────── Featured images ────────────────────────── */

export const teamPhoto: FeatureImage & { caption: string; date: string } = {
  src: "/images/team/botb-team-2026.jpg",
  alt: "The Southwestern University team smiling together in front of the Home Depot Technology backdrop at the 2026 HSI Battle of the Brains, with a Southwestern University sign held up in front.",
  caption: "Representing Southwestern University at the 2026 HSI Battle of the Brains.",
  date: "September 2026",
  // Leave aspectRatio out to show the whole photo uncropped.
  // To crop on phones, try: aspectRatio: { mobile: "4 / 3" }, then adjust objectPosition.
  objectPosition: { mobile: "50% 45%", desktop: "50% 40%" },
};

export const competitionGraphic: FeatureImage = {
  src: "/images/botb-2026-southwestern.jpg",
  alt: "2026 HSI Battle of the Brains graphic: Southwestern University, 2nd-Year Participant, September 28 – October 2, 2026.",
};

/* ─────────────────────────── Written copy ─────────────────────────── */

export const story = {
  paragraphs: [
    "2026 marks Southwestern University's second year at the HSI Battle of the Brains.",
    "Seven students came together with different experiences, interests, and perspectives, united by the opportunity to represent Southwestern and solve a challenging real-world problem.",
    "For some of us, this was our first Battle of the Brains. What began as a competition quickly became an experience built around late nights, difficult questions, new ideas, teamwork, and learning from one another.",
  ],
};

export const competition = {
  note: "We are grateful for the opportunity to continue Southwestern's presence at the competition and contribute our own chapter to that story.",
};

export const gratitude = {
  paragraphs: [
    "Behind the ideas, revisions, questions, long days, and final presentation were three people who gave us their time and guidance.",
    "Dr. Debika Sihi, Abby Dings, and Adrian D. Ramirez — thank you for challenging us, supporting us, and giving us the opportunity to represent Southwestern University.",
    "We are grateful for everything you did to help us get here.",
  ],
};

/* ──────────────────────────── The Seven ───────────────────────────── */
/*
 * Every member gets the same space on the page; the order is not a ranking.
 * Portraits were provided and confirmed by the team. Save a file at the path
 * in `image` and it appears automatically; until then initials are shown.
 */

export const team: TeamMember[] = [
  {
    name: "Asin Fathima Allavudeen",
    firstName: "Asin",
    initials: "AF",
    email: "allavudea@southwestern.edu",
    image: "/images/team/asin-allavudeen.png",
    // Fine-tune the crop if a face sits off-centre, e.g. "50% 30%".
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    bio: "Asin came into the week ready to take on a real-world problem with six classmates. Good questions came first, and every conversation along the way was a chance to learn something new.",
    linkedin: "",
  },
  {
    name: "Emma Sanchez",
    firstName: "Emma",
    initials: "ES",
    email: "sancheze@southwestern.edu",
    image: "/images/team/emma-sanchez.png",
    // Fine-tune the crop if a face sits off-centre, e.g. "50% 30%".
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    bio: "Emma joined the team to represent Southwestern and to see how much a small group can build in a single week. The whiteboard sessions, revisions, and late nights are all part of the story Emma shares with this team.",
    linkedin: "",
  },
  {
    name: "Alyanna Martinez",
    firstName: "Alyanna",
    initials: "AM",
    email: "martineza@southwestern.edu",
    image: "/images/team/alyanna-martinez.png",
    // Fine-tune the crop if a face sits off-centre, e.g. "50% 30%".
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    bio: "For Alyanna, the Battle of the Brains was about community: representing Southwestern and the people who made the trip possible. Somewhere between the first brainstorm and the final pitch, seven classmates became a team.",
    linkedin: "",
  },
  {
    name: "Elias Sarwana",
    firstName: "Elias",
    initials: "ES",
    email: "sarwanae@southwestern.edu",
    image: "/images/team/elias-sarwana.png",
    // Fine-tune the crop if a face sits off-centre, e.g. "50% 30%".
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    hometown: "Karachi, Pakistan",
    bio: "Every final boss has an origin story, and Elias's starts in Karachi, Pakistan, with the two people who have known him the longest, put up with him the most, and are the real reason he turned out this good. These days he runs on anything mango, mango juice above all.",
    linkedin: "",
    website: "https://codydiezz-droid.github.io/Elias/#origin",
  },
  {
    name: "Juan Carlos",
    firstName: "Juan",
    initials: "JC",
    email: "martinez2@southwestern.edu",
    image: "/images/team/juan-carlos.png",
    // Fine-tune the crop if a face sits off-centre, e.g. "50% 30%".
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    bio: "Juan Carlos took on the challenge alongside the rest of the seven, trading ideas, testing them, and starting over when something didn't work. The best moments came from figuring things out together.",
    linkedin: "",
  },
  {
    name: "Cody Diez Jennings",
    firstName: "Cody",
    initials: "CD",
    email: "diezjennc@southwestern.edu",
    image: "/images/team/cody-diez-jennings.png",
    // Fine-tune the crop if a face sits off-centre, e.g. "50% 30%".
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    bio: "Cody is grateful to have spent this week with these six teammates and three coaches. Representing Southwestern on this stage was a chance to keep learning and to push a little further than expected.",
    linkedin: "",
  },
  {
    name: "Jade Cindy Foka",
    firstName: "Jade",
    initials: "JF",
    email: "fokaj@southwestern.edu",
    image: "/images/team/jade-foka.jpg",
    // Fine-tune the crop if a face sits off-centre, e.g. "50% 30%".
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    bio: "Jade saw the competition as a chance to learn quickly, think on the spot, and grow with a group that started as classmates and finished as a team. Each round brought something new to work through together.",
    linkedin: "",
  },
];

/* ───────────────────────────── Coaches ────────────────────────────── */

export const coaches: Coach[] = [
  {
    honorific: "Dr.",
    name: "Debika Sihi",
    firstName: "Debika",
    initials: "DS",
    email: "sihid@southwestern.edu",
    image: "/images/coaches/debika-sihi.jpg",
    role: "Coach",
    title: "",
    profileUrl: "https://www.southwestern.edu/live/profiles/25848-debika-sihi",
    bio: "",
    linkedin: "",
  },
  {
    name: "Abby Dings",
    firstName: "Abby",
    initials: "AD",
    email: "dingsa@southwestern.edu",
    image: "/images/coaches/abby-dings.jpg",
    role: "Coach",
    title: "",
    profileUrl: "https://www.southwestern.edu/live/profiles/25780-abby-dings",
    bio: "",
    linkedin: "",
  },
  {
    name: "Adrian D. Ramirez",
    firstName: "Adrian",
    initials: "AR",
    email: "ramirezad@southwestern.edu",
    // Photo provided and confirmed by the team.
    image: "/images/coaches/adrian-ramirez.jpg",
    role: "Coach",
    title: "",
    profileUrl: "",
    bio: "",
    linkedin: "",
  },
];

/* ───────────────────────────── Journey ────────────────────────────── */
/*
 * Starter descriptions are intentionally general — rewrite them in your own
 * words. Add `image: "/images/journey/<file>.jpg"` to any step to show a photo.
 */

export const journey: JourneyStep[] = [
  {
    title: "Team Formed",
    description: "Seven Southwestern students came together as one team.",
  },
  {
    title: "The Challenge",
    description: "We received the challenge and started working to understand the problem in front of us.",
  },
  {
    title: "Research",
    description: "Asking questions, reading, and learning as much as we could before deciding anything.",
  },
  {
    title: "Brainstorming",
    description: "Sharing ideas, sketching possibilities, and choosing a direction together.",
  },
  {
    title: "Building",
    description: "Turning an idea into something real, one revision at a time.",
  },
  {
    title: "Testing",
    description: "Checking our assumptions and improving what didn't work.",
  },
  {
    title: "Pitch Practice",
    description: "Rehearsing, listening to feedback, and rehearsing again.",
  },
  {
    title: "Battle of the Brains",
    date: "Sept. 28 – Oct. 2, 2026",
    description: "Representing Southwestern University at the 2026 HSI Battle of the Brains.",
  },
  {
    title: "Final Presentation",
    description: "Sharing our work — together.",
  },
];

/* ───────────────────────────── Project ────────────────────────────── */
/*
 * Fill in only what you're ready to share. Empty fields are hidden.
 * While everything is empty, the section shows `projectEmptyMessage`.
 */

export const project: Project = {
  projectName: "",
  challenge: "",
  problem: "",
  targetUser: "",
  idea: "",
  solution: "",
  technology: "",
  testing: "",
  impact: "",
  lessons: "",
};

export const projectEmptyMessage = "We'll share more about what we built here after the competition.";

/* ───────────────────────────── Gallery ────────────────────────────── */
/*
 * Put photos in public/images/gallery/ and list them here.
 * Category must be one of: Competition, Working Sessions, Pitch Practice,
 * Travel, Team, Behind the Scenes. Missing files are skipped automatically.
 */

export const gallery: GalleryImage[] = [
  {
    src: "/images/team/botb-team-2026.jpg",
    alt: teamPhoto.alt,
    category: "Team",
    caption: "The team at the 2026 HSI Battle of the Brains.",
  },
  // {
  //   src: "/images/gallery/working-session-1.jpg",
  //   alt: "Three teammates sketching ideas on a whiteboard.",
  //   category: "Working Sessions",
  //   caption: "An early brainstorming session.",
  // },
];

export const galleryEmptyMessage = "Photos from the week will be added here soon.";
