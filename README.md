# Southwestern × BOTB 2026

A student-created website for the seven Southwestern University students and three coaches who represented
Southwestern at the **2026 HSI Battle of the Brains** (September 28 to October 2, 2026), Southwestern's second
year at the competition. The team built **OneBridge** in 24 hours, was named a finalist, and took 1st place for
business solution.

> This is a student-created team website. It is not an official website of Southwestern University or
> HSI Battle of the Brains.

Built with React, Vite and TypeScript, plain CSS, three.js for the hero animation, and Lucide icons. Fonts
(Schibsted Grotesk and Public Sans) are bundled with the site, so it makes no requests to font services.

**Live site:** https://codydiezz-droid.github.io/southwestern-botb-2026/

---

## The page, top to bottom

| Section | What it shows | Where the content lives |
| --- | --- | --- |
| Hero | Headline, award line, and a three.js bridge of light | `src/sections/Hero.tsx`, `result` and `event` in `siteData.ts` |
| Group photo and facts | The team and coaches, then five facts | `groupPhoto`, `src/sections/Group.tsx` |
| Meet the seven | A card for each student: portrait, home country, bio, LinkedIn | `team` |
| The coaches | Portrait, LinkedIn and Southwestern profile | `coaches`, `coachesIntro` |
| The week | A timeline of the week with event photos | `week`, `photos` |
| OneBridge | The problem as a scroll story, how it works, how we built it, pricing, links | `onebridge`, `presentation` |
| Photos | Every event photo, with a lightbox | `gallery` |
| Our final presentation | The recording of the final-round pitch and Q&A, played from YouTube | `finalVideo` |
| Thank you | Acknowledgments, a link to the mini game, and a one-line footer | `gratitude`, `miniGame` |

### The mini game: OneBridge Penalty Club

A separate page at `/penalty-club/`: a 3D penalty shootout built with three.js. Source in
`penalty-club/index.html` and `src/penalty/`.

- **Players:** the seven students and three coaches as blocky (Roblox / Minecraft style) characters. Their
  faces, skin tone, hair and glasses are drawn as pixel art to match their portraits (`src/penalty/players.ts`,
  `textures.ts`, `avatar.ts`). Students wear their home country's shirt, coaches the Southwestern Pirates shirt,
  all drawn in code with no real crests. Every player has the same stat total, spread differently.
- **Choose everyone:** pick your penalty taker and keeper and the opponent's taker and keeper (or leave
  the opponents on Random).
- **Stadium:** tiered end stands full of blocky fans (instanced, so it stays fast), and LED boards and a roof
  fascia carrying the event sponsors: The Home Depot, CrowdStrike, Dell and eBay, alongside OneBridge,
  Southwestern and HSI Battle of the Brains. The sponsor marks are simplified versions drawn in code in each
  brand's colours (`src/penalty/sponsors.ts`); swap in official artwork if the sponsors provide it.
- **Modes:** Penalty Challenge (5 shots), Goalkeeper Challenge (5 saves), Full Shootout (alternating, five
  each, early finish when one side cannot catch up, then sudden death) and Practice.
- **Shooting:** aim with the mouse or arrows, hold Space or the mouse button to charge, release to strike,
  Q / E to curve. The gold zone gives the cleanest strike; overpowered shots spray and rise.
- **Goalkeeping:** A / D to step across, arrows or mouse to pick the dive (Up for high), Space or click to
  dive. Diving early lets the striker go the other way; the striker's hips hint at the side (with
  disguises on harder levels).
- **Fair AI:** the keeper only reacts to the ball once it is struck and cannot see the curve; on Medium and
  Hard it learns a side you keep using. The striker only reacts to what your keeper has visibly done.
- **Physics** (`physics.ts`): gravity, drag and sidespin at a fixed 240 Hz, with posts, crossbar, net and
  the keeper's hands, head, body and legs as collision shapes, so results follow from what happened.
- **Extras:** slow motion and replays for golazos and great saves, synthesized sounds, records and settings
  saved in the browser, a first-match tutorial, pause, and touch controls.

---

## Run it on your computer

You need **Node.js 20.19 or newer**. Open a terminal in this folder:

```bash
npm install        # first time only
npm run dev        # local preview at http://localhost:5173
npm run build      # checks for errors and builds the site into dist/
npm run preview    # serves dist/ so you can check it before publishing
```

---

## Where everything lives

```
public/
  images/
    team/          ← student portraits (WebP) and the team-and-coaches photo
    coaches/       ← coach portraits
    event/         ← event photos, each as -800.webp and -1600.webp
    onebridge/     ← the dashboard image
  presentation/    ← the final pitch deck
src/
  data/
    siteData.ts    ← ★ THE FILE YOU EDIT: people, bios, the week, photos, OneBridge, settings
    types.ts       ← what each entry in siteData.ts can contain
  sections/        ← one file per page section
  components/      ← the 3D hero, OneBridge story, gallery and photo pieces
  lib/             ← small helpers (image paths, page motion)
  index.css        ← all styles, with the colours at the top
```

---

## Editing content

Everything on the page comes from `src/data/siteData.ts`.

- **Bios, home countries, LinkedIn:** edit the person's entry in `team` or `coaches`. Optional fields can be
  left as `""` and the layout adapts. `country` is used to count how many countries the team comes from.
- **Coach titles:** fill in `title` once confirmed. Until then each coach shows "Coach".
- **The final presentation:** `finalVideo.youtubeId` is the YouTube video (keep it Public or Unlisted). YouTube's
  privacy-enhanced player loads only after a visitor presses play.
- **Elias's Easter egg:** `portraitLink` on a student makes only their photo a link (no visible hint). It is
  set for Elias, pointing to his website.
- **Emails:** `showStudentEmails` and `showCoachEmails` are `false`, so no address appears on the page.
- **The result:** `result.award` and `result.summary`. Southwestern took 1st place for business solution and
  was a finalist. It did not win the overall competition, so never word it that way.

### Adding an event photo

Every event photo has two sizes. With ImageMagick:

```bash
magick photo.jpg -auto-orient -strip -resize "1600x1600>" -quality 74 public/images/event/name-1600.webp
magick photo.jpg -auto-orient -strip -resize "800x800>"  -quality 72 public/images/event/name-800.webp
```

Then add it to `photos` in `siteData.ts` with its width, height (of the 1600 file), alt text and caption, and
list it in `gallery` or in a step of `week`.

**Photo rules.** Only use photos the team took or was given. Never identify a person from a group photo:
captions name people only when the photographer did. Never use AI-generated faces. Don't filter or retouch.

The event photos came from the team's shared Google Drive. Captions follow the file names the coaches and
teammates gave them.

---

## Deploy to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes the site whenever the default branch changes. Pages is
already enabled (Settings → Pages → Source: GitHub Actions). Pull requests are built as a check but not
published.

`vite.config.ts` uses a relative `base` (`"./"`), and every path goes through `asset()` in
`src/lib/images.ts`, so the same build works at any repository subpath or on a custom domain. If the address
changes, update the `og:image` URL in `index.html` and `githubUrl` in `siteData.ts`.

### Publish as a single HTML file

```bash
npm run build:html
```

This creates `dist-html/index.html` (about 6 MB): the whole site in one file, with the script, styles, fonts and
photos embedded. It works opened straight from your computer. The deck download needs the
`presentation/` folder next to it. With both email settings off, the addresses are removed from the file.

---

## Design and accessibility notes

- **Colour:** Southwestern black, gold `#ffb81c` and cream `#f7f3ea`. On cream, gold text uses the darker
  `#835600` to keep AA contrast. The OneBridge section switches to the product's navy, blue and orange.
- **Motion:** sections fade up as they enter, timeline lines draw as you scroll, and photos drift slightly. The
  three.js scene loads after first paint, pauses when off screen, and is skipped on data saver, low-memory
  devices and for visitors with "Reduce motion" on (a static arc is shown instead). Reduced motion turns off
  every animation.
- **Access:** a skip link, visible two-tone focus rings, alt text on every photo, labelled new-tab links, and a
  lightbox that traps focus, works with arrow keys and swipes, closes on Escape, and returns focus.
- All seven students get identical cards, in no ranked order.
