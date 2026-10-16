# Gauntlet loop: performance over polish

Two review rounds of the team site and OneBridge Penalty Club, each seen from three seats:

- **Developer:** code, bugs, download size, frame cost.
- **Web organizer:** structure, navigation, loading.
- **Product manager:** finishing what matters, cutting what doesn't.

Each round went the same way:
1. Measure.
2. Each seat lists findings.
3. Pick the highest-payoff fixes, with pros and cons weighed.
4. Ship them, re-measure and test.

The goal was to finish the remaining work, trim the fat, and favour performance over looks.

Date: 16 October 2026 · Branch: `claude/blissful-knuth-4d9znp` (GitHub Pages deploys from it)

---

## Results at a glance

Same machine and same method, comparing the pre-gauntlet build (`e5716f9`) with the build after round 2 (`ea9765c`). Each figure is the median of 3 loads.

| Measure | Before | After | Change |
| --- | ---: | ---: | ---: |
| Team site JavaScript (phone) | 791 kB | **262 kB** | −67% |
| Team site total download (phone) | 1,095 kB | **566 kB** | −48% |
| Team site loads three.js (541 kB) | yes | **no** | removed |
| Game draw calls per frame (in a match) | 390 | **203** | −48% |
| Game triangles per frame, phones | 116k | **64k** | −45% |
| Game frame time, in a match (software GPU, 1× pixels) | 333 ms | **217 ms** | −35% |
| Game startup blocking, first 1.5 s (software GPU) | 1,595 ms | **1,451 ms** | −9%¹ |
| Online code (direct WebRTC packages) | 53 kB, ~27 sockets | **0 kB, ~13 sockets** | removed |
| Time to join a friend online (real internet) | 1.7 s | 1.7 s² | unchanged |
| Online join, offline match, results, rematch | pass | **pass** | — |
| Team site: errors, broken links, sideways scroll, accessibility | 0 | **0** | — |

¹ The test machine has no graphics card, so frame times are slow in absolute terms; compare before against after. The startup fix (compiling shaders in the background) depends on a feature real browsers with a GPU have (Chrome and Edge do). This machine lacks it, so the real-device gain should be larger than shown.
² Measured on GitHub's machines over the real internet just before the gauntlet. The routes that carry it (brokers and relays) were left untouched.

---

## Version history: restore points

Every version below is a commit on GitHub, so any one of them can be restored. To go back:
- **Undo one change:** `git revert <sha>`, then push. This adds an "undo" commit and keeps history.
- **Bring back the whole site as it was:** `git checkout <sha> -- . && git commit -m "Restore <sha>"`, then push.
- **Just look at an old version:** open `https://github.com/codydiezz-droid/Battle-of-the-Brains/commit/<sha>`.

A local tag `v1-pre-gauntlet` marks `e5716f9`. This environment can only push the branch, not tags, so the commit SHAs are the restore points.

| Version | Commit | What it is |
| --- | --- | --- |
| **v3: after round 2 (current)** | `ea9765c` | Background shader compile, faster pacing, thinner crowd on phones, one-line header |
| **v2: after round 1** | `6f90d91` | Site without three.js, blob shadows, merged stands, adaptive resolution, direct WebRTC removed, Play button |
| **v1: before the gauntlet** | `e5716f9` | Online join in ~1.7 s, invite links, single Easy difficulty, all features complete |
| Online in about a second | `23f041d` | Lobby freeze, fixed broker client ids |
| Invite links | `1c2cdd6` | Code travels in the link |
| One difficulty (Easy) | `7088718` | Difficulty picker removed |
| Brokers + diagnostics | `ea6e50c` | MQTT route, lobby diagnostic line |
| Aim drift | `1cdd0d7` | Aim circle moves on its own |
| Polish | `8bcce57` | Commentary, haptics, keeper replay angle |
| Save assist | `02f491d` | Much easier goalkeeping |
| Celebrations and progression | `e5c7f29` | 10 celebrations, win rules, XP, achievements, better faces and kits |
| Online two-player | `b9eb04f` | First online mode |
| 3D game | `9434fda` | Penalty Club rebuilt in 3D |
| Site redesign | `80aa6e6` | Team site in its current design |

---

## Baseline (before round 1)

- **Team site:** 16 requests and 1,095 kB on a phone, of which 791 kB is JavaScript. 541 kB of that is three.js, loaded only to animate one decorative light arc in the hero.
- **Game:** 384 draw calls and 117k triangles per frame, with a real-time shadow-map pass that draws part of the scene twice every frame, and 3.8 s of main-thread blocking around startup. 220 meshes come from the two crowd stands and the players. Each stand built ~70 separate boxes (steps, seat rows, railing posts, columns).
- **Online:** five routes running at once. In the real-internet check, the direct WebRTC routes took ~12 s to connect, the tracker route never connected on its own, and brokers and relays connected in ~2 s.
- **Site structure:** no navigation at all on phones (the header links hide below 760 px). The game is linked only from the very end of the page.

---

## Round 1

### Findings

**Developer**
1. three.js on the team site costs 541 kB for a decorative effect, and it's the biggest chunk of the site's JavaScript.
2. The shadow-map pass is the most expensive per-frame feature and adds little to a stylised blocky look.
3. ~140 draw calls come from stand pieces that never move and share a handful of colours.
4. Phones render up to 1.6× pixels with antialiasing, which is expensive on small GPUs.
5. Frame rate isn't protected: a slow device simply stutters.

**Web organizer**
1. No navigation on phones, and the game, the most engaging part, is hidden at the bottom.

**Product manager**
1. The direct WebRTC routes are fat: slowest, sometimes never connect, two packages, and many extra connections on every join. Brokers and relays already do the job faster.

### Decisions: pros and cons

| Change | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| Redraw the hero arc with the 2D canvas | −541 kB on the site; no WebGL needed; same look | Slightly fewer particles; flat perspective maths instead of a real camera | **Ship** |
| Blob shadows instead of shadow maps | Removes a full extra render pass every frame | No shadows from goalposts or the net; less realistic | **Ship** (performance over looks) |
| Merge the stand structure by material | ~140 fewer draw calls; identical look | Stand pieces can no longer move independently (they never do) | **Ship** |
| Phones: no antialiasing, ≤1.25× pixels | Big GPU saving on phones | Slightly softer edges on phones | **Ship** |
| Resolution that scales itself | Smooth play on slow devices instead of stutter | Image gets softer on slow devices | **Ship** |
| Remove the direct WebRTC routes | −53 kB, ~14 fewer sockets per join, simpler code | No browser-to-browser link if brokers and relays are ever all blocked | **Ship** (both proven routes stay) |
| "Play the game" button in the header | Game one tap away on every screen | One more element in the header | **Ship** |

### Result after round 1 (`6f90d91`)

- **Team site (phone):** 1,095 → 566 kB, and JavaScript 791 → 261 kB. three.js is no longer downloaded.
- **Game:** draw calls 384 → 204.
- **Checks:** online play, offline matches and the team site all passed.

---

## Round 2

### Findings

**Developer**
1. Profiling showed startup JavaScript is only ~250 ms. The rest of the ~4 s is the browser compiling 3D shaders and drawing the first frames, which blocks the page.
2. Triangles were unchanged at ~115k, almost all from the crowd.

**Web organizer**
1. The header name wraps onto two lines on small phones next to the Play button.
2. CSS for the removed difficulty picker was still shipping.

**Product manager**
1. Each kick spends a lot of time waiting: before the run-up, after the result, and in slow replays.
2. A proposed 3-kick quick match was **rejected as fat**. It's another mode to maintain, and faster pacing gets most of the benefit.

### Decisions: pros and cons

| Change | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| Compile shaders in the background (`compileAsync`) after the menu paints | The page stays responsive during startup on browsers with parallel compiling | The 3D scene appears a moment later on very slow devices | **Ship** |
| Faster pacing (0.9 → 0.6 s before the run-up, 2.6 → 1.9 s after a result, quicker replays) | Matches feel snappier; more kicks per minute | Slightly less time to read the result banner | **Ship** |
| Half the crowd on phones | −45% triangles on phones | Thinner stands up close (barely visible behind the menu and play) | **Ship** |
| One-line header on small phones ("Southwestern" only under 420 px) | Clean header with the Play button | Shorter name on the smallest screens | **Ship** |
| Remove the leftover difficulty CSS | Less dead code | none | **Ship** |
| 3-kick quick match | Shorter sessions | Another mode, more UI and testing | **Reject** |

### Result after round 2 (`ea9765c`)

See **Results at a glance**. Highlights: game draw calls −48% overall, frame time −35%, phone triangles −45%, and the team site's JavaScript −67%.

Checks after round 2, all passing:
- Goalkeeper Challenge from start to celebration to results.
- Online match with a synced celebration and rematch.
- Team site at desktop and phone sizes: no errors, broken images or links, sideways scrolling, or accessibility (axe) violations.

---

## What was trimmed

- three.js from the team site (541 kB).
- The shadow-map pass, shadow-light setup and shadow flags.
- Two online packages (`@trystero-p2p/nostr`, `@trystero-p2p/torrent`) and their routes, about 200 lines.
- ~70 separate stand meshes per stand, now about 7 merged ones.
- The difficulty picker's leftover CSS.
- Idle waiting between kicks.

## Backlog: not done, and why

| Idea | Pros | Cons | Recommendation |
| --- | --- | --- | --- |
| Global leaderboard | Strongest pull to replay and compete | Needs a hosted database (e.g. a free Supabase project) and moderation | Do it if someone can own a database account |
| Daily challenge (same 5 shots for everyone) | Daily habit; shareable result | New mode to build and balance | Good next feature |
| Shareable result image | Spreads better in group chats than text | Canvas drawing code to maintain | Nice to have |
| Retire the Claude-hosted copy of the game | One version to maintain; friends can't join it anyway unless invited | Loses the Claude room route | **Recommended**: share only the GitHub link |
| Check on a real phone with a GPU | Confirms the startup and frame gains this machine can't show | Needs a device | Try one match on your phone |
| Crowd drawn as a texture instead of 3D fans | Another big triangle cut | Flatter stands | Only if phones still stutter |

## How it was measured

- **Download size, requests and timings:** headless Chromium against the production build (`vite build`, served by `vite preview`).
- **Draw calls and triangles:** read from the renderer during a Penalty Challenge.
- **Frame time:** the median interval between frames over 40 frames at 1× pixels.
- **Before/after:** the pre-gauntlet commit built side by side and measured the same way.
- **Software GPU caveat:** the test machine renders 3D in software, so absolute frame times are much slower than any phone. The before/after ratios are what matter.
- **Online join time:** measured on GitHub's machines over the real internet, two separate browsers, three runs.
