/**
 * SITE DATA: the one file to edit.
 *
 * Every name, photo, bio, step and caption on the website comes from here.
 * Components never hardcode people.
 *
 *  • Optional fields can be left as "" and the layout adapts.
 *  • Only add information the person has shared or approved. Never guess.
 *  • Photo paths start with "/images/..." and point inside the /public folder.
 *  • Event photos came from the team's shared Google Drive. Captions follow the
 *    names the photographers gave them; nobody is identified from a group photo.
 */
import type { Coach, Photo, Presentation, Step, StoryBeat, TeamMember, WeekStep } from "./types";

/* ───────────────────────────── Settings ───────────────────────────── */

export const settings = {
  /** Email privacy. When false, no email address is rendered anywhere on the page. */
  showStudentEmails: false,
  showCoachEmails: false,
  /** Link to the source code in the footer line. Set to "" to hide it. */
  githubUrl: "https://github.com/codydiezz-droid/southwestern-botb-2026",
};

/* ────────────────────────────── Event ─────────────────────────────── */

export const event = {
  name: "HSI Battle of the Brains",
  year: 2026,
  dates: "September 28 to October 2, 2026",
  school: "Southwestern University",
  /** Southwestern's year at the competition, e.g. 2 for "second year". */
  yearsParticipating: 2,
  prompt: "The New Front Door: Trustworthy AI Product Discovery",
};

/**
 * Only what the team can state with confidence: 1st place for the business
 * solution, finalist, and presenting in the final round. Southwestern did not
 * win the overall competition, so never word it that way.
 */
export const result = {
  award: "1st place, Business Solution",
  summary:
    "The judges awarded OneBridge first place for business solution, and Southwestern was selected as a finalist to present it in the final round.",
};

/* ───────────────────────── Featured photos ────────────────────────── */

/** The seven students with their coaches. Shown full width under the hero. */
export const groupPhoto: Photo = {
  src: "/images/team/team-and-coaches-2026",
  width: 1600,
  height: 1200,
  alt: "The Southwestern University team and coaches standing together in business attire on a stone terrace, with trees and a red-roofed tower behind them.",
  caption: "The Southwestern team and coaches at the 2026 HSI Battle of the Brains.",
};

/* ─────────────────────────── Written copy ─────────────────────────── */

export const coachesIntro =
  "Three Southwestern mentors prepared us, pushed our thinking, and stayed with us through the competition.";

export const gratitude = {
  paragraph:
    "Thank you to our coaches, the HSI Battle of the Brains team, the judges, sponsors, volunteers, and everyone who made a week like this possible for students.",
  /** People and organizations named in the acknowledgments, in order. */
  recognize: [
    "Dr. Debika Sihi",
    "Dr. Abby Dings",
    "Adrian D. Ramirez",
    "Gregory Gibson Jr.",
    "HSI Battle of the Brains",
    "Southwestern University",
  ],
};

/* ──────────────────────────── The Seven ───────────────────────────── */
/* Every member gets the same space on the page; the order is not a ranking. */

export const team: TeamMember[] = [
  {
    name: "Asin Fathima Allavudeen",
    firstName: "Asin",
    initials: "AF",
    email: "allavudea@southwestern.edu",
    image: "/images/team/asin-allavudeen.webp",
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    location: "India",
    flag: "🇮🇳",
    country: "India",
    bio: "Asin came into the week ready to take on a real-world problem with six classmates. Good questions came first, and every conversation along the way was a chance to learn something new.",
    linkedin: "https://www.linkedin.com/in/asin-fathima-allavudeen-a49631303/",
  },
  {
    name: "Emma Sanchez",
    firstName: "Emma",
    initials: "ES",
    email: "sancheze@southwestern.edu",
    image: "/images/team/emma-sanchez.webp",
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    location: "United States",
    flag: "🇺🇸",
    country: "United States",
    bio: "Emma joined the team to represent Southwestern and to see how much a small group can build in a single week. The whiteboard sessions, revisions, and late nights are all part of the story Emma shares with this team.",
    linkedin: "https://www.linkedin.com/in/emma-sanchez-618a54404/",
  },
  {
    name: "Alyanna Martinez",
    firstName: "Alyanna",
    initials: "AM",
    email: "martineza@southwestern.edu",
    image: "/images/team/alyanna-martinez.webp",
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    location: "Mexico",
    flag: "🇲🇽",
    country: "Mexico",
    bio: "For Alyanna, the Battle of the Brains was about community: representing Southwestern and the people who made the trip possible. Somewhere between the first brainstorm and the final pitch, seven classmates became a team.",
    linkedin: "https://www.linkedin.com/in/alyanna-martinez088/",
  },
  {
    name: "Elias Sarwana",
    firstName: "Elias",
    initials: "ES",
    email: "sarwanae@southwestern.edu",
    image: "/images/team/elias-sarwana.webp",
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    hometown: "Karachi, Pakistan",
    location: "Pakistan",
    flag: "🇵🇰",
    country: "Pakistan",
    bio: "Originally from Karachi, Pakistan, Elias joined the team to represent Southwestern and take on a real-world business challenge in 24 hours. He worked alongside six classmates to research, build, and present OneBridge in the final round.",
    linkedin: "https://www.linkedin.com/in/esarwana/",
    portraitLink: "https://codydiezz-droid.github.io/Elias/",
  },
  {
    name: "Juan Carlos",
    firstName: "Juan",
    initials: "JC",
    email: "martinez2@southwestern.edu",
    image: "/images/team/juan-carlos.webp",
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    location: "Mexico City, Mexico",
    flag: "🇲🇽",
    country: "Mexico",
    bio: "Juan Carlos took on the challenge alongside the rest of the seven, trading ideas, testing them, and starting over when something didn't work. The best moments came from figuring things out together.",
    linkedin: "https://www.linkedin.com/in/jcarlos-martinez/",
  },
  {
    name: "Cody Diez Jennings",
    firstName: "Cody",
    initials: "CD",
    email: "diezjennc@southwestern.edu",
    image: "/images/team/cody-diez-jennings.webp",
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    location: "Madrid, Spain",
    flag: "🇪🇸",
    country: "Spain",
    bio: "Cody is grateful to have spent this week with these six teammates and three coaches. Representing Southwestern on this stage was a chance to keep learning and to push a little further than expected.",
    linkedin: "https://www.linkedin.com/in/codydiez/",
  },
  {
    name: "Jade Cindy Foka",
    firstName: "Jade",
    initials: "JF",
    email: "fokaj@southwestern.edu",
    image: "/images/team/jade-foka.webp",
    objectPosition: "50% 25%",
    major: "",
    classYear: "",
    location: "Cameroon",
    flag: "🇨🇲",
    country: "Cameroon",
    bio: "Jade saw the competition as a chance to learn quickly, think on the spot, and grow with a group that started as classmates and finished as a team. Each round brought something new to work through together.",
    linkedin: "https://www.linkedin.com/in/foka/",
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
    image: "/images/coaches/debika-sihi.webp",
    role: "Coach",
    title: "",
    profileUrl: "https://www.southwestern.edu/live/profiles/25848-debika-sihi",
    bio: "",
    linkedin: "https://www.linkedin.com/in/debika-sihi-23059b4/",
  },
  {
    honorific: "Dr.",
    name: "Abby Dings",
    firstName: "Abby",
    initials: "AD",
    email: "dingsa@southwestern.edu",
    image: "/images/coaches/abby-dings.webp",
    role: "Coach",
    title: "",
    profileUrl: "https://www.southwestern.edu/live/profiles/25780-abby-dings",
    bio: "",
    linkedin: "https://www.linkedin.com/in/abby-dings-b91b85163/",
  },
  {
    name: "Adrian D. Ramirez",
    firstName: "Adrian",
    initials: "AR",
    email: "ramirezad@southwestern.edu",
    // Photo provided and confirmed by the team.
    image: "/images/coaches/adrian-ramirez.webp",
    role: "Coach",
    title: "",
    profileUrl: "",
    bio: "",
    linkedin: "https://www.linkedin.com/in/adriandramirez/",
  },
];

/* ───────────────────────────── The week ───────────────────────────── */
/*
 * Photos from the shared Drive, in the order of the week. Each photo needs
 * public<src>-800.webp and public<src>-1600.webp.
 */

const p = (name: string, width: number, height: number, alt: string, caption: string): Photo => ({
  src: `/images/event/${name}`,
  width,
  height,
  alt,
  caption,
});

export const photos = {
  welcome: p(
    "cindy-welcome",
    1200,
    1600,
    "Jade Cindy Foka in a yellow Battle of the Brains shirt, holding the flag of Cameroon in front of the event backdrop.",
    "Jade Cindy Foka with the flag of Cameroon at the welcome event.",
  ),
  thrivent: p(
    "thrivent",
    1600,
    1197,
    "Students around a table working on a hands-on activity with craft supplies.",
    "A hands-on session with Thrivent.",
  ),
  barbeque: p(
    "barbeque",
    1600,
    1200,
    "Students relaxing on a covered patio with plates of barbecue on a low table.",
    "Barbecue and conversation between sessions.",
  ),
  hyperfocused: p(
    "hyperfocused",
    900,
    1600,
    "Students working at computers in a large lab during the challenge.",
    "Heads down during the 24-hour challenge.",
  ),
  hyperfocused2: p(
    "hyperfocused-2",
    900,
    1600,
    "A wider view of the computer lab with teams at work.",
    "The lab, late in the build.",
  ),
  trioPrep: p(
    "trio-prep",
    1200,
    1600,
    "Three teammates in business attire reviewing notes on a laptop before presenting.",
    "Getting mentally prepared before presenting.",
  ),
  beforePrez: p(
    "before-prez",
    1440,
    1080,
    "A group selfie of the team in business attire inside a van.",
    "On the way to present.",
  ),
  waiting: p(
    "waiting-finalists",
    1600,
    598,
    "Four teammates seated in an auditorium, smiling at the camera.",
    "Part of the team waiting to hear the finalists.",
  ),
  presenting: p(
    "finals-presenting",
    1600,
    868,
    "Two team members presenting on stage, with the OneBridge slides projected behind them.",
    "Jade Cindy Foka and Cody Diez Jennings presenting OneBridge.",
  ),
  allDone: p(
    "all-done",
    1600,
    1200,
    "The team in business attire standing together in a presentation room after presenting.",
    "All done: the team after presenting.",
  ),
  outdoors: p(
    "team-outdoors",
    1600,
    1200,
    "The team in business attire posing playfully outdoors in front of trees.",
    "A lighter moment outside.",
  ),
  scholarship: p(
    "cody-scholarship",
    1600,
    1131,
    "A stage with the eBay scholarship winners slide on the screen and students lined up beside a podium.",
    "Cody Diez Jennings on stage for the eBay scholarship.",
  ),
  scholarshipStage: p(
    "scholarship-stage",
    1600,
    1200,
    "Students in yellow event shirts on stage in front of the Battle of the Brains backdrop, with an audience in the foreground.",
    "The eBay scholarship semifinalists on stage, including Cody Diez Jennings.",
  ),
  fullTeam: {
    ...p(
      "full-team",
      1600,
      794,
      "All seven students and the three coaches standing together in business attire on a stone terrace, with trees behind them.",
      "Adrian D. Ramirez and Juan Carlos edited in with AI.",
    ),
    featured: true,
  },
  silly: p(
    "silly",
    1440,
    1080,
    "A close-up selfie of a teammate with others smiling in the background of the lab.",
    "A quick selfie during the build.",
  ),
};

export const week: WeekStep[] = [
  {
    title: "Welcome",
    body: "The week opened with the welcome event, where Team SU did its cheer and met the other teams.",
    photos: [photos.welcome],
  },
  {
    title: "Around the challenge",
    body: "Sessions with sponsors and shared meals filled the time around the challenge.",
    photos: [photos.thrivent, photos.barbeque],
  },
  {
    title: "The 24-hour challenge",
    body: "We had 24 hours to build a company around an AI-assisted product discovery solution. Research, business strategy, data analysis, design, AI, and financial modeling all went into OneBridge.",
    photos: [photos.hyperfocused, photos.hyperfocused2],
  },
  {
    title: "Getting ready",
    body: "We turned the work into a pitch, rehearsed it, and walked in together.",
    photos: [photos.trioPrep, photos.beforePrez],
  },
  {
    title: "Finalists and the final stage",
    body: "Southwestern was named a 2026 finalist. We presented OneBridge in the final round, and the judges awarded it first place for business solution.",
    photos: [photos.waiting, photos.presenting],
  },
  {
    title: "After presenting",
    body: "Seven students who started the week as classmates finished it as a team.",
    photos: [photos.allDone, photos.outdoors],
  },
];

/** Every photo in the gallery at the end of the page, in this order. */
export const gallery: Photo[] = [
  photos.fullTeam,
  photos.allDone,
  photos.presenting,
  photos.welcome,
  photos.hyperfocused,
  photos.outdoors,
  photos.trioPrep,
  photos.scholarship,
  photos.waiting,
  photos.thrivent,
  photos.beforePrez,
  photos.hyperfocused2,
  photos.barbeque,
  photos.scholarshipStage,
  photos.silly,
];

/* ───────────────────────────── OneBridge ──────────────────────────── */
/* What we built. Only describe what is in the presentation and prototype. */

export const onebridge = {
  name: "OneBridge",
  website: "https://onebridge-botb-2026.vercel.app/",
  lead: "When customers ask an AI assistant where to buy something, local shops are easy to miss. OneBridge gives assistants the facts the owner has approved.",
  story: [
    {
      kicker: "Maria",
      title: "Needs a part today.",
      body: "She asks an AI assistant where to buy a brake rotor nearby.",
    },
    {
      kicker: "The assistant",
      title: "Guesses.",
      body: "It sends her to a chain store across town. It has never seen the shop around the corner.",
      sr: "The assistant answers: Your best bet is a big chain store across town. Smaller shops may not carry it.",
    },
    {
      kicker: "Jorge",
      title: "Has it two blocks away.",
      body: "The rotor is on his shelf for $49.99. His prices, stock, and hours live in a spreadsheet no assistant can read.",
    },
    {
      kicker: "With OneBridge",
      title: "The answer is right.",
      body: "Jorge’s approved facts are published where AI assistants can read them, so Maria gets the right answer.",
      sr: "The connected assistant answers: Jorge’s Auto Parts, two blocks away, has one in stock for $49.99. They’re open until 6 PM.",
    },
  ] satisfies StoryBeat[],
  steps: [
    { title: "Share", body: "The owner uploads one document with products, prices, stock, and hours." },
    { title: "Verify", body: "An AI workflow organizes it and flags gaps. The owner approves every fact." },
    { title: "Connect", body: "OneBridge publishes the facts as a live feed AI assistants can read, plus an optional AI-ready website." },
    { title: "Monitor", body: "We check what assistants say about the business and help fix mistakes." },
  ] satisfies Step[],
  /** How the team split the 24 hours. */
  disciplines: ["Research", "Business strategy", "Data analysis", "Design", "AI", "Financial modeling"],
  pricing: { setup: "$250", monthly: "$149" },
};

/**
 * The recording of our final-round presentation, on YouTube
 * (https://youtu.be/2tXVRB6m89U). Keep it Public or Unlisted so it plays here.
 */
export const finalVideo = {
  youtubeId: "2tXVRB6m89U",
  title: "Southwestern University presenting OneBridge in the final round of the 2026 HSI Battle of the Brains",
  /** Approximate lengths, as described by the team. */
  pitch: "7 min",
  questions: "3 min",
  total: "About 10 minutes",
  credit: "Recording shared by Dr. Abby Dings.",
  poster: photos.presenting,
};

/** The final pitch deck, in public/presentation/. */
export const presentation: Presentation = {
  pptx: "/presentation/SU-OneBridge-Final-Pitch.pptx",
  fileNote: "PowerPoint, 9 MB",
};

export const dashboardImage = {
  src: "/images/onebridge/dashboard-mockup.webp",
  width: 1200,
  height: 777,
  alt: "The OneBridge dashboard from our final presentation, shown on a laptop with sample business data.",
};
