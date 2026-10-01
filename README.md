# Southwestern × BOTB 2026

A student-created website for the seven Southwestern University students and three coaches who represented
Southwestern at the **2026 HSI Battle of the Brains** (September 28 – October 2, 2026), Southwestern's second
year at the competition.

> This is a student-created team website. It is not an official website of Southwestern University or
> HSI Battle of the Brains.

Built with React, Vite, TypeScript, Tailwind CSS, Framer Motion and Lucide icons. Fonts (Bricolage Grotesque,
Instrument Sans, Instrument Serif) are bundled with the site, so it makes no requests to Google or other font
services.

---

## Contents

1. [Run the website on your computer](#1-run-the-website-on-your-computer)
2. [Where everything lives](#2-where-everything-lives)
3. [Add or replace the two main competition images](#3-add-or-replace-the-two-main-competition-images)
4. [Add a student or coach headshot](#4-add-a-student-or-coach-headshot)
5. [Change a person's bio and details](#5-change-a-persons-bio-and-details)
6. [Change image positioning (cropping)](#6-change-image-positioning-cropping)
7. [Add LinkedIn profiles](#7-add-linkedin-profiles)
8. [Hide or show email addresses](#8-hide-or-show-email-addresses)
9. [Add gallery images](#9-add-gallery-images)
10. [Edit the journey timeline](#10-edit-the-journey-timeline)
11. [Update the project section](#11-update-the-project-section)
12. [Image credits](#12-image-credits)
13. [Deploy to GitHub Pages](#13-deploy-to-github-pages)
14. [Photo status checklist](#14-photo-status-checklist)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Run the website on your computer

You need **Node.js 20.19 or newer** (Node 22 LTS is recommended). Download it from
[nodejs.org](https://nodejs.org/), then open a terminal in this folder:

```bash
npm install        # first time only: downloads the libraries the site uses
npm run dev        # starts a local preview at http://localhost:5173
```

Leave `npm run dev` running while you edit. The page refreshes by itself when you save a file or add a photo.

Other commands:

```bash
npm run build      # checks for errors and creates the finished site in the dist/ folder
npm run preview    # serves the finished dist/ folder so you can check it before publishing
```

---

## 2. Where everything lives

```
public/
  favicon.svg
  images/
    botb-2026-southwestern.jpg     ← the 2026 competition graphic
    team/
      botb-team-2026.jpg           ← the team photo at the competition
      <student headshots>.jpg
    coaches/                       ← coach headshots
    gallery/                       ← behind-the-scenes photos
    journey/                       ← optional photos for timeline steps
src/
  data/
    siteData.ts       ← ★ THE FILE YOU EDIT: people, emails, bios, journey, project, gallery, settings
    imageCredits.ts   ← where each photo of a person came from
    types.ts          ← the list of optional fields each person/photo can have
  sections/           ← one file per page section (Hero, Story, Team, Coaches, …)
  components/         ← reusable pieces (team card, coach card, timeline, gallery, …)
  index.css           ← colours, fonts and a few shared styles
```

**Almost every change is made in `src/data/siteData.ts`.** Components never hardcode names, emails or bios, so
you never need to hunt through the code to update a person.

### How photos work

Photo paths in `siteData.ts` start with `/images/…` and point inside the `public/` folder. For example,
`image: "/images/team/emma-sanchez.jpg"` means the file `public/images/team/emma-sanchez.jpg`.

**If the file doesn't exist yet, the site shows an intentional placeholder** (initials for people, a typographic
panel for the two main images). It never shows a broken image. When you run `npm run dev` or `npm run build`,
the terminal lists any photo that is referenced but missing:

```
[images] 12 photo(s) referenced in src/data are not in public/ yet (a placeholder is shown instead):
  · public/images/team/botb-team-2026.jpg
  ...
```

**Photo sizes:** big phone photos can be 5–10 MB. Resize before adding them so the site loads quickly on
phones. Aim for about **2400 px wide** for the team photo and gallery images, and **900–1200 px tall** for
headshots, saved as JPEG (quality ~80). On a Mac, Preview → Tools → Adjust Size works well. On Windows, use the
Photos app's Resize option.

---

## 3. Add or replace the two main competition images

| Image | Save it as | Used in |
| --- | --- | --- |
| Team photo in front of the Home Depot Technology backdrop | `public/images/team/botb-team-2026.jpg` | Large photo right under the opening headline, plus the gallery |
| 2026 HSI Battle of the Brains / Southwestern graphic | `public/images/botb-2026-southwestern.jpg` | "The competition" section |

To replace either one, save the new file **with exactly the same name** over the old one. Nothing else needs to
change.

To use a different file name, update `teamPhoto.src` or `competitionGraphic.src` in `src/data/siteData.ts`.
You can also edit the alt text (`alt`) and the caption under the team photo (`caption`, `date`) there.

**The team photo is shown uncropped by default**, so no one is ever cut out of the frame. See
[section 6](#6-change-image-positioning-cropping) if you'd like to crop it on phones.

---

## 4. Add a student or coach headshot

### Photo rules (please keep these)

Only use a photo when **the source clearly identifies that exact person**. In order of preference:

1. A photo the student or coach sends you directly
2. An official Southwestern University page (news story, faculty/staff profile, department page)
3. Southwestern Athletics
4. An official fellowship or organization profile

**Never** guess who someone is from a group photo, use a search result because someone "looks similar", use
social media photos without asking, use a photo of someone with a similar name, use AI-generated faces, or
scrape LinkedIn profile pictures.

### Steps

1. Save the photo in `public/images/team/` (students) or `public/images/coaches/` (coaches) using the file name
   already listed for that person in `siteData.ts`:

   | Person | File |
   | --- | --- |
   | Asin Fathima Allavudeen | `public/images/team/asin-allavudeen.png` |
   | Emma Sanchez | `public/images/team/emma-sanchez.png` |
   | Juan Carlos | `public/images/team/juan-carlos.png` |
   | Jade Cindy Foka | `public/images/team/jade-foka.jpg` |
   | Cody Diez Jennings | `public/images/team/cody-diez-jennings.png` |
   | Elias Sarwana | `public/images/team/elias-sarwana.png` |
   | Alyanna Martinez | `public/images/team/alyanna-martinez.png` |
   | Dr. Debika Sihi | `public/images/coaches/debika-sihi.jpg` |
   | Abby Dings | `public/images/coaches/abby-dings.jpg` |
   | Adrian D. Ramirez | `public/images/coaches/adrian-ramirez.jpg` |

2. That's it: the photo replaces the initials automatically. Portrait-shaped photos (taller than wide) look
   best; the cards use a 4:5 frame. PNG or JPEG both work, as long as the extension matches the `image` path.
3. If the photo came from a website, add or update its entry in `src/data/imageCredits.ts`
   (see [section 12](#12-image-credits)).

Alt text is generated as "Portrait of *Full Name*". To write your own, add `imageAlt: "…"` to that person.

---

## 5. Change a person's bio and details

Open `src/data/siteData.ts` and find the person in `team` (students) or `coaches`. Every field below is
optional. Fill in only what the person has shared or approved, and leave the rest as `""`:

```ts
{
  name: "Emma Sanchez",
  firstName: "Emma",            // used for "Meet Emma"
  initials: "ES",               // shown until a photo is added
  email: "sancheze@southwestern.edu",
  image: "/images/team/emma-sanchez.jpg",
  major: "",                    // e.g. "Computer Science"
  minor: "",
  classYear: "",                // "2027" displays as "Class of 2027"
  hometown: "",
  role: "",                     // e.g. "Design lead"
  bio: "",                      // a sentence or two
  personalQuote: "",            // shown in the profile pop-up
  linkedin: "",
  objectPosition: "",           // see section 6
},
```

- **Team cards** show the name, "Southwestern University", major/class year (if set) and the first lines of the
  bio.
- **Clicking a card** opens a profile with everything that's been filled in. If nothing is filled in yet, it
  shows a simple line about representing Southwestern, so the profile never looks empty.
- **Coaches** also accept `honorific` (e.g. `"Dr."`), `title`, `department` and `profileUrl` (a link to their
  official Southwestern profile).

The longer text blocks (the "Our story" paragraphs, the competition note and the thank-you message) are near
the top of `siteData.ts` under `story`, `competition` and `gratitude`.

---

## 6. Change image positioning (cropping)

Headshots are shown in a fixed 4:5 frame, so very wide or tall photos get cropped. `objectPosition` decides
which part stays visible. It takes two numbers: **horizontal % and vertical %**.

```ts
objectPosition: "50% 20%",   // centred, keep the top of the photo (good for faces)
objectPosition: "35% 30%",   // shift the frame left a little
```

The default for portraits is `"50% 25%"`, which keeps faces near the top in view.

**Different positions for phones and computers:**

```ts
objectPosition: { mobile: "50% 15%", desktop: "50% 30%" },
```

### Cropping the team photo

The team photo (`teamPhoto` in `siteData.ts`) is uncropped by default. To give it a fixed shape, add an
`aspectRatio`, then use `objectPosition` to keep everyone in frame:

```ts
export const teamPhoto = {
  src: "/images/team/botb-team-2026.jpg",
  // ...
  aspectRatio: { mobile: "4 / 3" },                     // crop only on phones
  objectPosition: { mobile: "50% 45%", desktop: "50% 40%" },
};
```

Always check on a phone afterwards (or use your browser's device toolbar) to make sure no one at the edges is cut
off. If in doubt, leave `aspectRatio` out.

---

## 7. Add LinkedIn profiles

Paste the full profile address into that person's `linkedin` field:

```ts
linkedin: "https://www.linkedin.com/in/your-name/",
```

A small LinkedIn link appears on their card and in their profile. Leave it as `""` to hide it.

---

## 8. Hide or show email addresses

At the top of `src/data/siteData.ts`:

```ts
export const settings = {
  showStudentEmails: false,
  showCoachEmails: false,
  // ...
};
```

- `false` (the default): **no email address is rendered anywhere on the page.** This is checked: with both
  settings off, the page contains zero email addresses.
- `true`: an "Email" link appears on each card for that group.

**Important:** the addresses are still written in `siteData.ts` and in the site's JavaScript file. If the
repository is public (GitHub Pages on a free account needs a public repository), anyone browsing the code can
read them. If that matters, delete the addresses from `siteData.ts` (set `email: ""`) instead of only hiding
them.

To show a general contact link in the footer, set `contactEmail` in `settings`.

---

## 9. Add gallery images

1. Put the photos in `public/images/gallery/` (resized as described in [section 2](#2-where-everything-lives)).
2. Add one entry per photo to the `gallery` list in `siteData.ts`:

```ts
export const gallery: GalleryImage[] = [
  {
    src: "/images/gallery/working-session-1.jpg",
    alt: "Three teammates sketching ideas on a whiteboard.",   // describe what's happening
    category: "Working Sessions",
    caption: "An early brainstorming session.",                // optional
  },
  // ...
];
```

`category` must be one of: `Competition`, `Working Sessions`, `Pitch Practice`, `Travel`, `Team`,
`Behind the Scenes`. Filter buttons appear only for categories that have photos.

Clicking a photo opens a lightbox (arrow keys or swiping move between photos; Escape closes it). Until at least
one gallery photo exists, the section shows a short "photos will be added here soon" note (editable as
`galleryEmptyMessage`). The team photo is already listed, so it appears in the gallery once it's added.

Please only post photos of people who are comfortable being on the site.

---

## 10. Edit the journey timeline

The nine steps are in the `journey` list in `siteData.ts`. The starter descriptions are deliberately general.
Rewrite them in your own words.

```ts
{
  title: "Brainstorming",
  description: "Sharing ideas, sketching possibilities, and choosing a direction together.",
  date: "",                                         // optional small label
  image: "/images/journey/brainstorming.jpg",       // optional photo
  imageAlt: "The team around a table covered in sticky notes.",
},
```

Steps without an `image` stay purely typographic, so there are no empty boxes.

---

## 11. Update the project section

Fill in the `project` object in `siteData.ts` when you're ready to share it:

```ts
export const project: Project = {
  projectName: "",
  challenge: "",
  problem: "",
  targetUser: "",
  idea: "",
  solution: "",
  technology: "",          // a sentence, or a list: ["React", "Python", "Figma"]
  testing: "",
  impact: "",
  lessons: "",
};
```

Empty fields are hidden. While **everything** is empty, the section shows `projectEmptyMessage` ("We'll share
more about what we built here after the competition.") instead, so nothing is revealed before you're ready.

---

## 12. Image credits

`src/data/imageCredits.ts` records where every photo of a person came from:

```ts
{
  person: "Jade Cindy Foka",
  file: "/images/team/jade-foka.jpg",
  source: "Southwestern University News",
  sourceUrl: "https://www.southwestern.edu/live/news/17394-jade-cindy-foka-28-becomes-third-student-in",
  photographer: "",            // fill in if the source names one
  usageNotes: "Portrait from an official Southwestern University feature about Jade.",
},
```

A small "Photo credits" list appears in the footer, but only for photos that are actually on the site.

---

## 13. Deploy to GitHub Pages

The repository already includes a deployment workflow (`.github/workflows/deploy.yml`). It builds the site and
publishes it every time the `main` branch changes. Pull requests are built as a check but not published.

**One-time setup:**

1. Make sure the site is on a branch called **`main`** (merge your pull request into `main`, or create `main`
   from your working branch).
2. On GitHub, open the repository → **Settings** → **Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab. The "Deploy to GitHub Pages" workflow runs on the next push to `main` (or click
   **Run workflow** to start it by hand).
5. When it finishes, the site is live at:

   **https://codydiezz-droid.github.io/Battle-of-the-Brains/**

After that, every change merged into `main` goes live automatically within a minute or two.

**Why it works from a subpath:** `vite.config.ts` uses a relative `base` (`"./"`), and every image path goes
through a small helper (`asset()` in `src/lib/images.ts`). The same build works at `/Battle-of-the-Brains/`, at
any other repository name, or on a custom domain, with no changes.

If you rename the repository or add a custom domain, also update the `og:image` address in `index.html` (it
controls the preview picture when the link is shared) and `githubUrl` in `siteData.ts`.

---

## 14. Photo status checklist

| Person | Photo | Status |
| --- | --- | --- |
| Asin Fathima Allavudeen | `public/images/team/asin-allavudeen.png` | Provided by the team. Add the file |
| Emma Sanchez | `public/images/team/emma-sanchez.png` | Provided by the team. Add the file |
| Alyanna Martinez | `public/images/team/alyanna-martinez.png` | Provided by the team. Add the file |
| Elias Sarwana | `public/images/team/elias-sarwana.png` | Provided by the team. Add the file |
| Juan Carlos | `public/images/team/juan-carlos.png` | Provided by the team. Add the file |
| Cody Diez Jennings | `public/images/team/cody-diez-jennings.png` | Provided by the team. Add the file |
| Jade Cindy Foka | `public/images/team/jade-foka.jpg` | Initials (JF) until a preferred photo is provided |
| Dr. Debika Sihi | `public/images/coaches/debika-sihi.jpg` ([official profile](https://www.southwestern.edu/live/profiles/25848-debika-sihi)) | To download |
| Abby Dings | `public/images/coaches/abby-dings.jpg` ([official profile](https://www.southwestern.edu/live/profiles/25780-abby-dings)) | To download |
| Adrian D. Ramirez | `public/images/coaches/adrian-ramirez.jpg` | Only a photo a Southwestern source clearly identifies as Adrian |
| Team photo | `public/images/team/botb-team-2026.jpg` | Added |
| Competition graphic | `public/images/botb-2026-southwestern.jpg` | Added |

Student cards all use the same 4:5 frame with slightly rounded corners and `object-fit: cover`, so photos with
different crops and backgrounds still line up. If a face sits off-centre, adjust that student's
`objectPosition` (see [section 6](#6-change-image-positioning-cropping)). Photos are never filtered or retouched.

---

## 15. Troubleshooting

- **My photo doesn't show up.** Check the file name and folder match the `image` path exactly. Names are
  case-sensitive on GitHub Pages: `Jade-Foka.JPG` is not the same as `jade-foka.jpg`. The terminal's
  `[images]` list tells you which files it can't find.
- **`npm run build` shows a red error.** It usually means a typo in `siteData.ts`, like a missing comma or
  quote. The message includes the file and line number.
- **The live site didn't update.** Open the **Actions** tab on GitHub and check the latest
  "Deploy to GitHub Pages" run. A red ✗ means the build failed. Click it to see why.
- **Someone's face is cut off.** Adjust their `objectPosition` ([section 6](#6-change-image-positioning-cropping)).

---

### Design & accessibility notes

- Colours: near-black `#111111`, Southwestern-inspired gold `#F4B41A`, warm cream `#F6F2E9`, white, and a
  restrained deep green `#1F4A3A`. Gold is used for text only on dark backgrounds, or as a darker shade on light
  ones, to keep contrast readable.
- Semantic landmarks, a "Skip to content" link, visible keyboard focus, descriptive alt text, and keyboard
  support for the menu, profiles and lightbox (Escape closes, focus returns to where you were).
- Animations are calm (fades, small movements, a number counter, line reveals) and are reduced automatically
  when a visitor's device has "Reduce motion" turned on.
- All seven students get identical cards, in no ranked order.
