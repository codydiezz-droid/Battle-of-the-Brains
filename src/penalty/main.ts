import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/public-sans";
import "./penalty.css";
import { DIFF } from "./ai";
import * as sfx from "./audio";
import { Engine, type KickResult, type Role, type SentDive, type SentResult, type Shot } from "./game";
import { joinRoom, newCode, warmUp, type NetPeer, type NetRoom } from "./net";
import { byId, roster, type Player } from "./players";
import { persist, save } from "./storage";
import { cardPortrait } from "./textures";
import { celebrations } from "./celebrations";
import { achievements, award, levelOf, unlock, xpFor, type Achievement, type Award } from "./progress";

type Mode = "challenge" | "keeper" | "shootout" | "practice" | "online";

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const siteUrl = document.body.dataset.siteUrl || "../";
document.querySelectorAll<HTMLAnchorElement>("[data-site-link]").forEach((a) => (a.href = siteUrl));

const engine = new Engine($<HTMLCanvasElement>("#pitch"));
// ?debug exposes the engine for automated play-testing
if (new URLSearchParams(location.search).has("debug")) (window as unknown as { pcEngine: Engine }).pcEngine = engine;
sfx.setMuted(save.muted);

/* ───────────────────────────── Screens ───────────────────────────── */

const screens = ["menu", "select", "hud", "paused", "end", "online", "lobby", "trophies", "celebrate"] as const;
type Screen = (typeof screens)[number];
function show(...visible: Screen[]) {
  for (const s of screens) $(`#${s}`).hidden = !visible.includes(s);
  const top = visible[visible.length - 1];
  $(`#${top}`).querySelector<HTMLElement>("[data-autofocus]")?.focus();
}

/* ───────────────────────────── Menu ───────────────────────────── */

let mode: Mode = "challenge";

function syncMenu() {
  const d = save.difficulty;
  $("[data-best=challenge]").textContent = `Best: ${save.best.challenge[d]} / 5`;
  $("[data-best=keeper]").textContent = `Best: ${save.best.keeper[d]} saves`;
  $("[data-best=shootout]").textContent = `Record: ${save.shootout.wins} won, ${save.shootout.losses} lost`;
  const acc = save.totals.shots ? Math.round((save.totals.goals / save.totals.shots) * 100) : 0;
  const sv = save.totals.faced ? Math.round((save.totals.saves / save.totals.faced) * 100) : 0;
  $("[data-best=practice]").textContent = save.totals.shots || save.totals.faced ? `Career: ${acc}% scored, ${sv}% saved` : "No kicks yet";
  syncSound();
  syncProfile();
}

/* ───────────────────────────── Progress ───────────────────────────── */

function levelProgress(xp: number) {
  const l = levelOf(xp);
  const lo = xpFor(l);
  const hi = xpFor(l + 1);
  return { level: l, into: xp - lo, need: hi - lo, pct: ((xp - lo) / (hi - lo)) * 100 };
}

function syncProfile() {
  const p = levelProgress(save.xp);
  $("#profile-level").textContent = `Lv ${p.level}`;
  $("#profile-fill").style.width = `${p.pct}%`;
  $("#profile-xp").textContent = `${p.into} / ${p.need} XP`;
  const st = $("#profile-streak");
  st.hidden = save.streak.days < 2;
  st.textContent = `${save.streak.days}-day streak`;
  $("#open-trophies").textContent = `Trophies ${save.achievements.length} / ${achievements.length}`;
}

function renderTrophies() {
  const lvl = levelOf(save.xp);
  $("#trophies-kicker").textContent = `Level ${lvl} · ${save.xp} XP`;
  const cels = $("#trophy-cels");
  cels.innerHTML = "";
  for (const c of celebrations) {
    const li = document.createElement("li");
    li.className = c.level > lvl ? "locked" : "";
    li.innerHTML = `<strong></strong><span></span>`;
    li.querySelector("strong")!.textContent = c.name;
    li.querySelector("span")!.textContent = c.level > lvl ? `Unlocks at level ${c.level}` : c.by;
    cels.appendChild(li);
  }
  const achs = $("#trophy-achs");
  achs.innerHTML = "";
  for (const a of achievements) {
    const got = save.achievements.includes(a.id);
    const li = document.createElement("li");
    li.className = got ? "got" : "locked";
    li.innerHTML = `<strong></strong><span></span>`;
    li.querySelector("strong")!.textContent = got ? `${a.name} ✓` : a.name;
    li.querySelector("span")!.textContent = a.how;
    achs.appendChild(li);
  }
}
$("#open-trophies").addEventListener("click", () => {
  renderTrophies();
  show("trophies");
});
$("#trophies-back").addEventListener("click", () => {
  syncMenu();
  show("menu");
});

/* Achievement toasts, one at a time */
const toastQueue: string[] = [];
let toastBusy = false;
function toast(html: string) {
  toastQueue.push(html);
  if (!toastBusy) nextToast();
}
function nextToast() {
  const t = $("#toast");
  const html = toastQueue.shift();
  if (!html) {
    toastBusy = false;
    t.hidden = true;
    return;
  }
  toastBusy = true;
  t.innerHTML = html;
  t.hidden = false;
  window.setTimeout(nextToast, 2600);
}
let matchUnlocks: Achievement[] = [];
function achieve(id: string) {
  const a = unlock(id);
  if (!a) return;
  matchUnlocks.push(a);
  toast(`<strong>Achievement:</strong> ${a.name}`);
}
/** Achievements any single kick can earn. */
function kickAchievements(r: KickResult) {
  if (r.role === "shoot" && r.outcome === "goal") {
    achieve("first-goal");
    if (r.perfect) achieve("perfect");
    if (r.label === "GOLAZO!") achieve("golazo");
    if (save.totals.goals >= 25) achieve("century");
  }
  if (r.role === "keep" && r.outcome !== "goal") achieve("first-save");
}


document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    mode = b.dataset.mode as Mode;
    openSelect();
  }),
);

function syncSound() {
  for (const id of ["#menu-sound", "#sound"]) {
    const b = $(id);
    b.textContent = save.muted ? "Sound off" : "Sound on";
    b.setAttribute("aria-pressed", String(save.muted));
  }
}
for (const id of ["#menu-sound", "#sound"])
  $(id).addEventListener("click", () => {
    save.muted = !save.muted;
    sfx.setMuted(save.muted);
    if (!save.muted && !$("#hud").hidden) sfx.startAmbience();
    persist();
    syncSound();
  });

$("#menu-tutorial").addEventListener("click", () => {
  save.tutorial = { shoot: false, keep: false };
  persist();
  $("#menu-tutorial").textContent = "Tutorial will show in your next match";
});

/* ───────────────────────────── Select ───────────────────────────── */

type Slot = "shoot" | "keep" | "cpuShoot" | "cpuKeep";
const slotKey: Record<Slot, "shooterId" | "keeperId" | "cpuShooterId" | "cpuKeeperId"> = {
  shoot: "shooterId",
  keep: "keeperId",
  cpuShoot: "cpuShooterId",
  cpuKeep: "cpuKeeperId",
};
const slotLabel: Record<Slot, string> = {
  shoot: "Your taker",
  keep: "Your keeper",
  cpuShoot: "Their taker",
  cpuKeep: "Their keeper",
};
let tab: Slot = "shoot";

/** Which of the four players a mode uses. */
function slots(): Slot[] {
  if (mode === "online") return ["shoot", "keep"];
  if (mode === "challenge") return ["shoot", "cpuKeep"];
  if (mode === "keeper") return ["keep", "cpuShoot"];
  return ["shoot", "keep", "cpuShoot", "cpuKeep"];
}

function openSelect() {
  const used = slots();
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) => (b.hidden = !used.includes(b.dataset.tab as Slot)));
  tab = used[0];
  $("#select-title").textContent = mode === "online" ? "Pick your players" : "Pick the players";
  $("#kickoff").textContent = mode === "online" ? "Back to the lobby" : "Kick off";
  renderCards();
  show("select");
  $("#cards").querySelector<HTMLButtonElement>("[aria-pressed=true]")?.focus();
}

function statBar(label: string, value: number) {
  return `<span class="stat"><span>${label}</span><span class="pips" role="img" aria-label="${value} out of 5">${[1, 2, 3, 4, 5]
    .map((i) => `<i class="${i <= value ? "on" : ""}"></i>`)
    .join("")}</span></span>`;
}

function renderCards() {
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  const grid = $("#cards");
  grid.innerHTML = "";
  const current = save[slotKey[tab]];
  const shooting = tab === "shoot" || tab === "cpuShoot";
  const choose = (id: string, b: HTMLButtonElement) => {
    save[slotKey[tab]] = id;
    persist();
    grid.querySelectorAll(".card").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
    syncPicked();
    // Move on to the next player to pick
    const used = slots();
    const next = used[used.indexOf(tab) + 1];
    if (next) {
      tab = next;
      window.setTimeout(renderCards, 180);
    }
  };
  if (tab === "cpuShoot" || tab === "cpuKeep") {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "card card-random";
    b.setAttribute("aria-pressed", String(current === "random"));
    b.innerHTML = `<span class="card-dice" aria-hidden="true">?</span><span class="card-name">Random</span><span class="card-kit">Surprise me</span>`;
    b.addEventListener("click", () => choose("random", b));
    grid.appendChild(b);
  }
  for (const p of roster) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "card";
    b.setAttribute("aria-pressed", String(p.id === current));
    const s = p.stats;
    const stats = shooting ? statBar("Power", s.power) + statBar("Accuracy", s.accuracy) : statBar("Reflexes", s.reflex) + statBar("Reach", s.reach);
    b.innerHTML = `<span class="card-art"></span>
      <span class="card-name">${p.name}</span>
      <span class="card-kit"><span aria-hidden="true">${p.flag}</span> ${p.kit.label} · ${p.number}</span>
      <span class="card-style">${p.style}</span>
      <span class="card-stats">${stats}</span>`;
    const art = cardPortrait(p, 132);
    art.setAttribute("aria-hidden", "true");
    b.querySelector(".card-art")!.appendChild(art);
    b.addEventListener("click", () => choose(p.id, b));
    grid.appendChild(b);
  }
  syncPicked();
}

function syncPicked() {
  $("#picked").innerHTML = slots()
    .map((s) => {
      const id = save[slotKey[s]];
      return `${slotLabel[s]}: <strong>${id === "random" ? "Random" : byId(id).firstName}</strong>`;
    })
    .join(" · ");
}

document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) =>
  b.addEventListener("click", () => {
    tab = b.dataset.tab as Slot;
    renderCards();
  }),
);
$("#select-back").addEventListener("click", () => {
  if (mode === "online" && net) return backToLobby();
  syncMenu();
  show("menu");
});
$("#kickoff").addEventListener("click", () => {
  if (mode === "online" && net) {
    net.room.setPresence({ taker: save.shooterId, keeper: save.keeperId });
    return backToLobby();
  }
  startMatch();
});

/* ───────────────────────────── Match ───────────────────────────── */

interface MatchState {
  mode: Mode;
  you: boolean[]; // your penalties: true = scored
  cpu: boolean[]; // CPU penalties: true = scored
  kicks: KickResult[];
  practiceRole: Role;
  myShooter: Player;
  myKeeper: Player;
  cpuShooter: Player;
  cpuKeeper: Player;
  over: boolean;
}

let match: MatchState;

function pickCpu(exclude: string[]) {
  const pool = roster.filter((p) => !exclude.includes(p.id));
  return pool[Math.floor(Math.random() * pool.length)];
}

function startMatch() {
  const myShooter = byId(save.shooterId);
  const myKeeper = byId(save.keeperId);
  const cpuShooter = save.cpuShooterId === "random" ? pickCpu([myShooter.id, myKeeper.id]) : byId(save.cpuShooterId);
  const cpuKeeper = save.cpuKeeperId === "random" ? pickCpu([myShooter.id, myKeeper.id, cpuShooter.id]) : byId(save.cpuKeeperId);
  match = { mode, you: [], cpu: [], kicks: [], practiceRole: "shoot", myShooter, myKeeper, cpuShooter, cpuKeeper, over: false };
  matchUnlocks = [];
  if (mode === "keeper") match.practiceRole = "keep";
  engine.setDifficulty(save.difficulty);
  engine.resetMemory();
  $("#practice-switch").hidden = mode !== "practice";
  $("#team-cpu").hidden = mode !== "shootout";
  $("#pause").hidden = false;
  $("#team-cpu .team-name").textContent = "CPU";
  show("hud");
  sfx.startAmbience();
  nextKick();
}

/** Whose turn it is, from the rules of the mode. */
function nextRole(): Role {
  if (match.mode === "challenge") return "shoot";
  if (match.mode === "keeper") return "keep";
  if (match.mode === "practice") return match.practiceRole;
  // Shootout: you shoot first in every round
  return match.you.length <= match.cpu.length ? "shoot" : "keep";
}

/** Clear the result banner (and a celebration shout left by a restart). */
function clearBanner() {
  const b = $("#banner");
  b.hidden = true;
  b.classList.remove("celebrate-shout");
}

function nextKick() {
  clearBanner();
  const role = nextRole();
  if (role === "shoot") engine.setCast(match.myShooter, match.cpuKeeper);
  else engine.setCast(match.cpuShooter, match.myKeeper);
  engine.startKick(role);
  engine.snapCamera();
  updateBoard();
  const shooter = role === "shoot" ? match.myShooter : match.cpuShooter;
  const keeper = role === "shoot" ? match.cpuKeeper : match.myKeeper;
  $("#who-shoot").innerHTML = `${face(shooter)}<span>${shooter.firstName}${role === "shoot" ? " (you)" : ""}</span>`;
  $("#who-keep").innerHTML = `${face(keeper)}<span>${keeper.firstName}${role === "keep" ? " (you)" : ""}</span>`;
  $("#meters").hidden = role !== "shoot";
  $("#shuffle").hidden = role !== "keep";
  $("#practice-switch").textContent = match.practiceRole === "shoot" ? "Switch to keeper" : "Switch to striker";
  startTutorial(role);
  commentate(role, shooter, keeper);
}

const faceCache = new Map<string, string>();
function face(p: Player) {
  if (!faceCache.has(p.id)) faceCache.set(p.id, cardPortrait(p, 36, false).toDataURL());
  return `<img src="${faceCache.get(p.id)}" alt="" width="36" height="36" />`;
}

engine.onHint = (text) => ($("#hint").textContent = text);

engine.onResult = (r) => {
  if (net?.matchId) return onlineResult(r);
  match.kicks.push(r);
  if (r.role === "shoot") {
    match.you.push(r.outcome === "goal");
    save.totals.shots++;
    if (r.outcome === "goal") save.totals.goals++;
    if (r.outcome === "goal" && r.perfect) save.totals.perfect++;
  } else {
    match.cpu.push(r.outcome === "goal");
    save.totals.faced++;
    if (r.outcome !== "goal") save.totals.saves++;
  }
  persist();
  kickAchievements(r);
  resultBuzz(r);
  showBanner(r.label, r.good);
  updateBoard();
  $("#live").textContent = `${r.label} ${boardText()}`;
  finishTutorialStep();
};

engine.onKickDone = () => {
  $("#banner").hidden = true;
  if (net?.matchId) return onlineKickDone();
  if (match.over) return;
  const decided = matchDecided();
  if (decided) finishMatch(decided);
  else nextKick();
};

function showBanner(text: string, good: boolean) {
  const b = $("#banner");
  b.textContent = text;
  b.className = `banner ${good ? "good" : "bad"}`;
  b.hidden = false;
}

const goals = (a: boolean[]) => a.filter(Boolean).length;

/** "you" / "cpu" when a shootout is over, "done" for the single-role modes. */
function matchDecided(m: Pick<MatchState, "mode" | "you" | "cpu"> = match): "you" | "cpu" | "done" | null {
  if (m.mode === "practice") return null;
  if (m.mode === "challenge") return m.you.length >= 5 ? "done" : null;
  if (m.mode === "keeper") return m.cpu.length >= 5 ? "done" : null;
  const y = goals(m.you);
  const c = goals(m.cpu);
  const ny = m.you.length;
  const nc = m.cpu.length;
  if (ny <= 5 && nc <= 5 && !(ny === 5 && nc === 5)) {
    // Regulation: stop as soon as one side cannot catch up
    if (y > c + (5 - nc)) return "you";
    if (c > y + (5 - ny)) return "cpu";
    return null;
  }
  // Sudden death: decided after each complete pair
  if (ny === nc && y !== c) return y > c ? "you" : "cpu";
  return null;
}

/* ───────────────────────────── Commentary ───────────────────────────── */

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
let commentTimer = 0;
function say(line: string) {
  const c = $("#commentary");
  c.textContent = line;
  c.hidden = false;
  // Restart the entrance animation
  c.style.animation = "none";
  void c.offsetWidth;
  c.style.animation = "";
  window.clearTimeout(commentTimer);
  commentTimer = window.setTimeout(() => (c.hidden = true), 3600);
}

/** A line for a five-kick duel, from the striker's goals and the keeper's stops so far. */
function duelLine(striker: string, keeper: string, scored: number, taken: number) {
  const stops = taken - scored;
  if (taken === 0) return pick([`${striker} places the ball. Five kicks to decide it.`, `${keeper} bounces on the line. Here we go.`]);
  if (scored >= STRIKER_NEEDS) return pick([`${striker} has already won it. Now for style.`, `It’s won. Can ${striker} add one more?`]);
  if (stops >= 5 - STRIKER_NEEDS + 1) return pick([`${keeper} has won it. Pride on the line now.`, `${keeper} has done the job. Clean sheet next?`]);
  const needGoals = STRIKER_NEEDS - scored;
  const left = 5 - taken;
  if (needGoals === left) return pick([`${striker} can’t miss another. Every kick has to go in.`, `No room for error now for ${striker}.`]);
  if (needGoals === 1) return pick([`Score this and ${striker} wins it!`, `One more goal and it’s over for ${keeper}.`]);
  if (stops === 1) return pick([`One more stop and ${keeper} wins it.`, `${keeper} needs just one more save.`]);
  return pick([`${striker} steps up…`, `${keeper} studies the run-up.`, `The crowd goes quiet for ${striker}.`, `${striker} takes a deep breath.`]);
}

/** Before each offline kick: a line that reads the situation. */
function commentate(role: Role, shooter: Player, keeper: Player) {
  const m = match;
  const s = shooter.firstName;
  const k = keeper.firstName;
  if (m.mode === "practice") return;
  if (m.mode === "challenge") return say(duelLine(s, k, goals(m.you), m.you.length));
  if (m.mode === "keeper") return say(duelLine(s, k, goals(m.cpu), m.cpu.length));
  // Shootout: what would this kick decide?
  const mine = role === "shoot" ? m.you : m.cpu;
  const ifGoal = matchDecided({ mode: m.mode, you: role === "shoot" ? [...mine, true] : m.you, cpu: role === "shoot" ? m.cpu : [...mine, true] });
  const ifMiss = matchDecided({ mode: m.mode, you: role === "shoot" ? [...mine, false] : m.you, cpu: role === "shoot" ? m.cpu : [...mine, false] });
  const sudden = m.you.length >= 5 && m.cpu.length >= 5;
  if (role === "shoot") {
    if (ifGoal === "you") return say(pick([`Score this and ${s} wins the shootout!`, `${s} has the chance to win it!`]));
    if (ifMiss === "cpu") return say(pick([`${s} must score to stay alive.`, `Miss this and it’s over. No pressure, ${s}.`]));
  } else {
    if (ifMiss === "you") return say(pick([`Save this and ${k} wins it!`, `One stop from glory for ${k}.`]));
    if (ifGoal === "cpu") return say(pick([`${s} can win it for them. ${k} needs a save!`, `Stop this or it’s over, ${k}.`]));
  }
  if (sudden) return say(pick(["Sudden death. Nerves of steel.", `Sudden death. ${s} against ${k}.`]));
  if (m.you.length === 0 && role === "shoot") return say(`${s} takes the first kick of the shootout.`);
  return say(pick([`${s} steps up…`, `${k} spreads the arms wide.`, `${s} picks a spot.`, `The crowd holds its breath.`]));
}

/** Before each online kick. */
function commentateOnline(striker: Player, keeper: Player) {
  if (!net) return;
  if (settings().format === "duel") {
    const shots = shotsOf(strikerSide(0));
    return say(duelLine(striker.firstName, keeper.firstName, goals(shots), shots.length));
  }
  if (net.k >= 10) return say(pick(["Sudden death. Nerves of steel.", `Sudden death. ${striker.firstName} against ${keeper.firstName}.`]));
  say(pick([`${striker.firstName} steps up…`, `${keeper.firstName} spreads the arms wide.`, `The crowd holds its breath.`]));
}

/* ───────────────────────────── Haptics ───────────────────────────── */

/** A short buzz on phones that support it (most Android browsers; not iPhone Safari). */
function buzz(pattern: number | number[]) {
  if (save.muted || !matchMedia("(pointer: coarse)").matches) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}
const resultBuzz = (r: KickResult) => buzz(r.good ? (r.outcome === "goal" ? [40, 60, 90] : [25, 40, 25, 40, 60]) : 120);

function boardText() {
  const m = match;
  if (m.mode === "challenge") return `${goals(m.you)} scored from ${m.you.length}.`;
  if (m.mode === "keeper") return `${m.cpu.length - goals(m.cpu)} saved from ${m.cpu.length}.`;
  return `You ${goals(m.you)}, CPU ${goals(m.cpu)}.`;
}

/** Green circle for a goal, red for a miss or save; outlines for kicks to come. */
function dots(results: boolean[], slots: number) {
  const out: string[] = [];
  for (let i = 0; i < Math.max(slots, results.length); i++) {
    const r = results[i];
    out.push(r === undefined ? `<i aria-hidden="true"></i>` : `<i class="${r ? "scored" : "missed"}" aria-hidden="true"></i>`);
  }
  return out.join("");
}

/** The duel's state from the player's side: still to play for, won, or out of reach. */
function duelNote(scored: number, taken: number, striking: boolean) {
  const stops = taken - scored;
  if (scored >= STRIKER_NEEDS) return striking ? "you’ve won it" : "the striker has won it";
  if (stops >= 5 - STRIKER_NEEDS + 1) return striking ? "the keeper has won it" : "you’ve won it";
  return striking ? `score ${STRIKER_NEEDS - scored} more to win` : `stop ${5 - STRIKER_NEEDS + 1 - stops} more to win`;
}

function updateBoard() {
  const m = match;
  const sudden = m.mode === "shootout" && m.you.length >= 5 && m.cpu.length >= 5;
  if (m.mode === "challenge" || (m.mode === "practice" && m.practiceRole === "shoot")) {
    $("#dots-you").innerHTML = dots(m.mode === "practice" ? m.you.slice(-5) : m.you, 5);
    $("#score").textContent = m.mode === "practice" ? `${goals(m.you)} / ${m.you.length}` : `${goals(m.you)} / 5`;
    $("#status").textContent = m.mode === "practice" ? "Practice · shooting" : `Penalty ${Math.min(m.you.length + 1, 5)} of 5 · ${duelNote(goals(m.you), m.you.length, true)}`;
  } else if (m.mode === "keeper" || (m.mode === "practice" && m.practiceRole === "keep")) {
    // For a keeper, green is a stop
    const saves = m.cpu.map((g) => !g);
    $("#dots-you").innerHTML = dots(m.mode === "practice" ? saves.slice(-5) : saves, 5);
    $("#score").textContent = m.mode === "practice" ? `${goals(saves)} / ${saves.length} saved` : `${goals(saves)} saved`;
    $("#status").textContent = m.mode === "practice" ? "Practice · in goal" : `Penalty ${Math.min(m.cpu.length + 1, 5)} of 5 · ${duelNote(goals(m.cpu), m.cpu.length, false)}`;
  } else {
    const slots = sudden ? Math.max(m.you.length, m.cpu.length) + (m.you.length === m.cpu.length ? 1 : 0) : 5;
    $("#dots-you").innerHTML = dots(m.you, slots);
    $("#dots-cpu").innerHTML = dots(m.cpu, slots);
    $("#score").textContent = `${goals(m.you)} – ${goals(m.cpu)}`;
    const round = Math.min(m.you.length, m.cpu.length) + 1;
    const turn = nextRole() === "shoot" ? "you shoot" : "you save";
    $("#status").textContent = sudden ? `Sudden death · ${turn}` : `Round ${Math.min(round, 5)} · ${turn}`;
  }
}

/*
 * Who wins a five-kick duel: the striker needs 4 goals; 2 stops (saves,
 * posts or misses) win it for the keeper. The two can never both happen.
 */
const STRIKER_NEEDS = 4;
const strikerWon = (scored: number) => scored >= STRIKER_NEEDS;

interface Celebrant {
  player: Player;
  keeper: boolean;
}

/** Offline: who celebrates, and whether that is the human player. */
function offlineWinner(result: "you" | "cpu" | "done"): { winner: Celebrant; loser: Celebrant; human: boolean } | null {
  const m = match;
  const striker = (p: Player): Celebrant => ({ player: p, keeper: false });
  const keeper = (p: Player): Celebrant => ({ player: p, keeper: true });
  if (m.mode === "challenge") {
    return strikerWon(goals(m.you))
      ? { winner: striker(m.myShooter), loser: keeper(m.cpuKeeper), human: true }
      : { winner: keeper(m.cpuKeeper), loser: striker(m.myShooter), human: false };
  }
  if (m.mode === "keeper") {
    return strikerWon(goals(m.cpu))
      ? { winner: striker(m.cpuShooter), loser: keeper(m.myKeeper), human: false }
      : { winner: keeper(m.myKeeper), loser: striker(m.cpuShooter), human: true };
  }
  if (m.mode === "shootout") {
    return result === "you"
      ? { winner: striker(m.myShooter), loser: keeper(m.cpuKeeper), human: true }
      : { winner: striker(m.cpuShooter), loser: keeper(m.myKeeper), human: false };
  }
  return null;
}

function finishMatch(result: "you" | "cpu" | "done") {
  match.over = true;
  $("#status").textContent = "Full time";
  const w = offlineWinner(result);
  if (!w) return endMatch(result);
  const run = (id: string) => playCelebration(w.winner, w.loser, id, () => endMatch(result));
  if (w.human) pickCelebration("You win", run);
  else run(cpuCelebration());
}

/** Celebrations this player has unlocked. */
const unlockedCelebrations = () => celebrations.filter((c) => c.level <= levelOf(save.xp));
const cpuCelebration = () => celebrations[Math.floor(Math.random() * celebrations.length)].id;

let pickTimer = 0;
/** The winner chooses a celebration (the last one used is offered first; 10 s to choose). */
function pickCelebration(kicker: string, then: (id: string) => void) {
  const grid = $("#cel-grid");
  grid.innerHTML = "";
  const lvl = levelOf(save.xp);
  let done = false;
  const choose = (id: string) => {
    if (done) return;
    done = true;
    window.clearInterval(pickTimer);
    save.celebration = id;
    persist();
    show("hud");
    then(id);
  };
  for (const c of celebrations) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cel";
    b.disabled = c.level > lvl;
    b.setAttribute("aria-pressed", String(c.id === save.celebration));
    b.innerHTML = `<span class="cel-name"></span><span class="cel-by"></span>`;
    b.querySelector(".cel-name")!.textContent = c.name;
    b.querySelector(".cel-by")!.textContent = c.level > lvl ? `Unlocks at level ${c.level}` : c.by;
    b.addEventListener("click", () => choose(c.id));
    grid.appendChild(b);
  }
  $("#celebrate-kicker").textContent = kicker;
  const fallback = unlockedCelebrations().some((c) => c.id === save.celebration) ? save.celebration : "siu";
  let left = 10;
  const tick = () => ($("#cel-timer").textContent = `${celebrations.find((c) => c.id === fallback)!.name} in ${left} s if you don’t choose`);
  tick();
  window.clearInterval(pickTimer);
  pickTimer = window.setInterval(() => {
    left--;
    if (left <= 0) choose(fallback);
    else tick();
  }, 1000);
  $("#meters").hidden = true;
  $("#shuffle").hidden = true;
  show("celebrate");
  (grid.querySelector<HTMLButtonElement>("[aria-pressed=true]:not(:disabled)") ?? grid.querySelector<HTMLButtonElement>("button:not(:disabled)"))?.focus();
}

function playCelebration(winner: Celebrant, loser: Celebrant, id: string, then: () => void) {
  const c = celebrations.find((x) => x.id === id) ?? celebrations[0];
  $("#meters").hidden = true;
  $("#shuffle").hidden = true;
  $("#coach").hidden = true;
  show("hud");
  showBanner(c.shout, true);
  $("#banner").classList.add("celebrate-shout");
  $("#commentary").hidden = true;
  buzz([60, 80, 60, 80, 160]);
  $("#live").textContent = `${winner.player.firstName} celebrates: ${c.name}.`;
  engine.celebrate(winner.player, winner.keeper, loser.player, loser.keeper, c.id, () => {
    $("#banner").hidden = true;
    $("#banner").classList.remove("celebrate-shout");
    then();
  });
}

/** XP for a finished match, shown on the results screen. */
function showAward(kicks: KickResult[], won: boolean) {
  const shots = kicks.filter((k) => k.role === "shoot");
  const faced = kicks.filter((k) => k.role === "keep");
  const scored = shots.filter((k) => k.outcome === "goal").length;
  const saved = faced.filter((k) => k.outcome !== "goal").length;
  const perfect = shots.filter((k) => k.outcome === "goal" && k.perfect).length;
  const lines: [string, number][] = [
    ["Match played", 10],
    [`Goals × ${scored}`, scored * 10],
    [`Stops × ${saved}`, saved * 12],
    [`Perfect strikes × ${perfect}`, perfect * 5],
    ["Win", won ? 40 : 0],
  ];
  renderAward(award(lines));
}

function renderAward(a: Award) {
  $("#end-xp").hidden = false;
  const before = levelProgress(a.before);
  const after = levelProgress(a.after);
  $("#end-level").textContent = `Lv ${after.level}`;
  $("#end-gained").textContent = `+${a.gained} XP`;
  const fillEl = $("#end-fill");
  fillEl.style.transition = "none";
  fillEl.style.width = `${a.levelUp ? 0 : before.pct}%`;
  void fillEl.offsetWidth;
  fillEl.style.transition = "";
  window.setTimeout(() => (fillEl.style.width = `${after.pct}%`), 60);
  const ul = $("#end-xp-lines");
  ul.innerHTML = "";
  for (const [label, n] of a.lines) {
    const li = document.createElement("li");
    li.innerHTML = `<span></span><span>+${n}</span>`;
    li.querySelector("span")!.textContent = label;
    ul.appendChild(li);
  }
  const notes: string[] = [];
  if (a.levelUp) notes.push(`Level up! You are now level ${after.level}.`);
  if (a.newCelebrations.length) notes.push(`New celebration: ${a.newCelebrations.join(", ")}.`);
  if (matchUnlocks.length) notes.push(`Achievement: ${matchUnlocks.map((x) => x.name).join(", ")}.`);
  const un = $("#end-unlocks");
  un.hidden = !notes.length;
  un.textContent = notes.join(" ");
  if (a.levelUp) sfx.crowd("cheer", true);
}

let shareText = "";
$("#share").addEventListener("click", async () => {
  const url = location.origin + location.pathname;
  const text = `${shareText} Think you can beat it? OneBridge Penalty Club:`;
  try {
    if (navigator.share) await navigator.share({ title: "OneBridge Penalty Club", text, url });
    else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast("Result copied. Paste it to a friend.");
    }
  } catch {
    /* the share sheet was closed */
  }
});

function endMatch(result: "you" | "cpu" | "done") {
  match.over = true;
  ($("#rematch") as HTMLButtonElement).disabled = false;
  $("#rematch").textContent = "Rematch";
  $("#to-lobby").hidden = true;
  sfx.stopAmbience();
  const m = match;
  const d = save.difficulty;
  let title = "";
  let kicker = "";
  let score = "";
  let line = "";
  let best = false;
  let won = false;
  if (m.mode === "challenge") {
    const n = goals(m.you);
    kicker += "Penalty Challenge";
    won = strikerWon(n);
    title = n === 5 ? "PERFECT FIVE!" : won ? "YOU BEAT THE KEEPER!" : "THE KEEPER WINS";
    score = `${n} / 5`;
    line = ["The keeper had your number.", "One goal. Work on your timing.", "Two goals. Aim further from the keeper.", "Three goals. One short: you need 4 to win.", "Four from five. Ice cold.", "Five from five. Clinical."][n];
    shareText = `I scored ${n} from 5 penalties in OneBridge Penalty Club.`;
    if (n === 5) achieve("clinical");
    if (n > save.best.challenge[d]) {
      save.best.challenge[d] = n;
      best = true;
    }
  } else if (m.mode === "keeper") {
    const n = m.cpu.filter((g) => !g).length;
    kicker += "Goalkeeper Challenge";
    won = !strikerWon(5 - n);
    title = n >= 4 ? "A WALL!" : won ? "YOU WIN IN GOAL!" : "THE STRIKER WINS";
    score = `${n} / 5`;
    line = ["They found the corners every time.", "One stop. You need 2 to win.", "Two stops. That’s the win.", "Three stops. A proper keeper.", "Four stops. Outstanding.", "Clean sheet. Unbeatable."][n];
    shareText = `I kept out ${n} of 5 penalties in OneBridge Penalty Club.`;
    if (n >= 4) achieve("wall");
    if (n > save.best.keeper[d]) {
      save.best.keeper[d] = n;
      best = true;
    }
  } else {
    kicker += "Full Shootout";
    won = result === "you";
    title = won ? "SHOOTOUT WINNER!" : "Shootout lost";
    shareText = `I ${won ? "won" : "lost"} a penalty shootout ${goals(m.you)}–${goals(m.cpu)}.`;
    if (won) achieve("shootout");
    if (won && m.you.length > 5) achieve("sudden");
    score = `${goals(m.you)} – ${goals(m.cpu)}`;
    const sudden = m.you.length > 5;
    line = won ? (sudden ? "Won in sudden death." : "Southwestern wins it.") : sudden ? "Lost in sudden death." : "So close. Rematch?";
    if (won) save.shootout.wins++;
    else save.shootout.losses++;
    if (won) sfx.crowd("cheer", true);
  }
  persist();
  $("#end-kicker").textContent = kicker;
  $("#end-title").textContent = title;
  $("#end-score").textContent = score;
  $("#end-line").textContent = best ? `${line} New personal best!` : line;
  const shots = m.kicks.filter((k) => k.role === "shoot");
  const faced = m.kicks.filter((k) => k.role === "keep");
  const rows: [string, string][] = [];
  if (shots.length) {
    rows.push(["Shots scored", `${shots.filter((k) => k.outcome === "goal").length} / ${shots.length}`]);
    rows.push(["Perfect strikes", String(shots.filter((k) => k.perfect && k.outcome === "goal").length)]);
    rows.push(["Fastest shot", `${Math.round(Math.max(...shots.map((k) => k.speed)) * 3.6)} km/h`]);
  }
  if (faced.length) rows.push(["Penalties saved", `${faced.filter((k) => k.outcome !== "goal").length} / ${faced.length}`]);
  $("#end-stats").innerHTML = rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("");
  showAward(m.kicks, won);
  show("end");
}

$("#rematch").addEventListener("click", () => (net ? onlineRematch() : startMatch()));
$("#end-menu").addEventListener("click", () => {
  if (net) leaveOnline();
  syncMenu();
  show("menu");
});

$("#practice-switch").addEventListener("click", () => {
  if (match.mode !== "practice") return;
  match.practiceRole = match.practiceRole === "shoot" ? "keep" : "shoot";
  if (engine.phase === "aim" || engine.phase === "ready" || engine.phase === "idle") nextKick();
  else $("#practice-switch").textContent = match.practiceRole === "shoot" ? "Striker next kick" : "Keeper next kick";
});

/* Pause */
function pause() {
  // Online, both screens keep playing: no pausing one side
  if ($("#hud").hidden || engine.paused || net?.matchId) return;
  engine.paused = true;
  show("hud", "paused");
}
function resume() {
  engine.paused = false;
  show("hud");
  $<HTMLCanvasElement>("#pitch").focus();
}
$("#pause").addEventListener("click", pause);
$("#resume").addEventListener("click", resume);
$("#restart").addEventListener("click", () => {
  engine.paused = false;
  startMatch();
});
$("#to-menu").addEventListener("click", () => {
  engine.paused = false;
  engine.cancelCelebration();
  engine.phase = "idle";
  if (match) match.over = true;
  sfx.stopAmbience();
  syncMenu();
  show("menu");
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" || e.key.toLowerCase() === "p") {
    if (engine.paused) resume();
    else pause();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});

/* Touch controls for curve and stepping */
$("#curve-left").addEventListener("click", () => engine.setCurve(engine.curve - 0.25));
$("#curve-right").addEventListener("click", () => engine.setCurve(engine.curve + 0.25));
$("#shuffle-left").addEventListener("click", () => engine.touchShuffle(-1));
$("#shuffle-right").addEventListener("click", () => engine.touchShuffle(1));

/* Meters follow the engine every frame */
const fill = $("#power-fill");
const overMark = $("#power-over");
const curveDot = $("#curve-dot");
const sweetZone = $(".power-sweet");
function meters() {
  const p = engine.power;
  const over = DIFF[save.difficulty].overStart;
  fill.style.height = `${p * 100}%`;
  overMark.style.bottom = `${over * 100}%`;
  const [lo, hi] = DIFF[save.difficulty].sweet;
  sweetZone.style.bottom = `${lo * 100}%`;
  sweetZone.style.height = `${(hi - lo) * 100}%`;
  fill.className = `power-fill${p > over ? " hot" : p >= lo && p <= hi ? " sweet" : ""}`;
  curveDot.style.left = `${50 + engine.curve * 45}%`;
  requestAnimationFrame(meters);
}
meters();

/* ───────────────────────────── Tutorial ───────────────────────────── */

const shootSteps = [
  { id: "aim", text: "Move the mouse (or arrow keys) to aim. The circle drifts on its own, so keep correcting it." },
  { id: "charge", text: "Hold Space or the mouse button to charge power." },
  { id: "release", text: "Release in the gold zone. In the red it may fly over." },
  { id: "curve", text: "Optional: Q / E bends the shot around the keeper." },
];
const keepSteps = [
  { id: "shuffle", text: "A / D steps you across the line before the kick." },
  { id: "direction", text: "Arrows or the mouse choose where you’ll dive (Up for high)." },
  { id: "dive", text: "Space or click dives. Time it with the strike: too early and the striker goes the other way." },
];
let tutorial: { role: Role; done: Set<string> } | null = null;

function startTutorial(role: Role) {
  const seen = role === "shoot" ? save.tutorial.shoot : save.tutorial.keep;
  if (seen) {
    $("#coach").hidden = true;
    tutorial = null;
    return;
  }
  tutorial = { role, done: new Set() };
  $("#coach-title").textContent = role === "shoot" ? "How to shoot" : "How to keep goal";
  renderCoach();
  $("#coach").hidden = false;
}

function renderCoach() {
  if (!tutorial) return;
  const t = tutorial;
  const steps = t.role === "shoot" ? shootSteps : keepSteps;
  $("#coach-steps").innerHTML = steps
    .map((s) => `<li class="${t.done.has(s.id) ? "done" : ""}"><span class="tick" aria-hidden="true"></span>${s.text}${t.done.has(s.id) ? '<span class="sr-only"> (done)</span>' : ""}</li>`)
    .join("");
}

engine.onAction = (a) => {
  if (!tutorial || tutorial.done.has(a)) return;
  tutorial.done.add(a);
  renderCoach();
};

function finishTutorialStep() {
  if (!tutorial) return;
  if (tutorial.role === "shoot") save.tutorial.shoot = true;
  else save.tutorial.keep = true;
  persist();
  const t = tutorial;
  window.setTimeout(() => {
    if (tutorial === t) {
      $("#coach").hidden = true;
      tutorial = null;
    }
  }, 1800);
}

$("#coach-skip").addEventListener("click", () => {
  save.tutorial = { shoot: true, keep: true };
  persist();
  $("#coach").hidden = true;
  tutorial = null;
  $<HTMLCanvasElement>("#pitch").focus();
});

/* ───────────────────────────── Online ───────────────────────────── */

/*
 * Two players, live. Each side keeps its own presence object current and
 * reads the other's: the striker sends the shot at release, the keeper sends
 * their position and dive as they happen and, being the one who saw the ball
 * arrive, decides the result for both screens.
 */

type Side = "host" | "guest";
interface OnlineState {
  room: NetRoom;
  host: boolean;
  ready: boolean;
  matchId: string | null;
  /** The last match id followed, so returning to the lobby doesn't rejoin it. */
  lastMatch: string | null;
  k: number;
  hostShots: boolean[];
  guestShots: boolean[];
  /** Every kick's result by kick number (true = goal); the keeper's screen has the final say. */
  outcomes: boolean[];
  kicks: KickResult[];
  opp: NetPeer | null;
  seenDive: string;
  over: boolean;
  /** Set while the loser waits for the winner to pick a celebration. */
  waitCel: ((id: string) => void) | null;
}
let net: OnlineState | null = null;

const opp = () => (net?.opp?.presence ?? {}) as Record<string, unknown> & {
  nick?: string;
  host?: boolean;
  ready?: boolean;
  taker?: string;
  keeper?: string;
  format?: string;
  hostRole?: string;
  match?: string | null;
  k?: number;
  shot?: Shot & { k: number };
  dive?: SentDive & { k: number };
  kx?: { k: number; x: number };
  res?: SentResult & { k: number };
  cel?: { m: string; id: string };
  log?: { m: string; r: Record<string, number> };
};

const cleanNick = (s: unknown) => (typeof s === "string" ? s.replace(/[^\p{L}\p{N} ._-]/gu, "").trim().slice(0, 16) : "") || "Player 2";
const oppName = () => cleanNick(opp().nick);
const safeId = (id: unknown, fallback: string) => (typeof id === "string" && roster.some((p) => p.id === id) ? id : fallback);

/** The host's settings, which the guest follows. */
function settings() {
  const src = net?.host ? { format: hostFormat, hostRole: hostStartRole } : { format: opp().format, hostRole: opp().hostRole };
  return { format: src.format === "shootout" ? "shootout" : "duel", hostRole: src.hostRole === "keep" ? "keep" : "shoot" } as const;
}
let hostFormat: "duel" | "shootout" = "duel";
let hostStartRole: Role = "shoot";

const mySide = (): Side => (net?.host ? "host" : "guest");
function strikerSide(k: number): Side {
  const { format, hostRole } = settings();
  const first: Side = hostRole === "shoot" ? "host" : "guest";
  if (format === "duel") return first;
  return k % 2 === 0 ? first : first === "host" ? "guest" : "host";
}
const myRole = (k: number): Role => (strikerSide(k) === mySide() ? "shoot" : "keep");
function picksOf(side: Side) {
  if (side === mySide()) return { taker: byId(save.shooterId), keeper: byId(save.keeperId) };
  const o = opp();
  return { taker: byId(safeId(o.taker, "elias")), keeper: byId(safeId(o.keeper, "debika")) };
}

$("#open-online").addEventListener("click", () => {
  mode = "online";
  ($("#nick") as HTMLInputElement).value = save.nick;
  $("#online-note").textContent = "";
  show("online");
});
$("#online-back").addEventListener("click", () => {
  syncMenu();
  show("menu");
});
$("#create-game").addEventListener("click", () => joinAs(newCode(), true));
$("#join-game").addEventListener("click", () => {
  const code = ($("#join-code") as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 4) {
    $("#online-note").textContent = "Enter the 4-character code your friend sees.";
    return;
  }
  joinAs(code, false);
});
$("#join-code").addEventListener("keydown", (e) => {
  if ((e as KeyboardEvent).key === "Enter") $("#join-game").click();
});

async function joinAs(code: string, host: boolean) {
  save.nick = cleanNick(($("#nick") as HTMLInputElement).value);
  persist();
  $("#online-note").textContent = "Connecting…";
  let room: NetRoom;
  try {
    room = await joinRoom(code, new URLSearchParams(location.search).has("local"));
  } catch {
    $("#online-note").textContent = "Couldn’t connect. Check your connection and try again.";
    return;
  }
  net = { room, host, ready: false, matchId: null, lastMatch: null, k: 0, hostShots: [], guestShots: [], outcomes: [], kicks: [], opp: null, seenDive: "", over: false, waitCel: null };
  room.setPresence({
    app: "pc",
    v: 1,
    nick: save.nick,
    host,
    ready: false,
    taker: save.shooterId,
    keeper: save.keeperId,
    format: host ? hostFormat : null,
    hostRole: host ? hostStartRole : null,
    match: null,
    k: 0,
  });
  room.onPeers((peers) => onPeers(peers));
  $("#lobby-code").textContent = code;
  syncTransport();
  window.clearInterval(transportTimer);
  transportTimer = window.setInterval(() => {
    if (!net) return window.clearInterval(transportTimer);
    if (!$("#lobby").hidden) syncTransport();
  }, 2000);
  syncLobbySettings();
  renderLobby();
  show("lobby");
}

let transportTimer = 0;
/** What the lobby says about the connection: live routes, and reachable servers. */
function syncTransport() {
  if (!net) return;
  const r = net.room;
  const online = r.transports.some((t) => t !== "local");
  const { up, total } = r.servers();
  let text: string;
  if (!online) text = "Same device only · open this page in a second window to test";
  else if (net.opp) text = "Connected · live";
  else if (r.transports.includes("claude")) text = "Live · connected through claude.ai" + (total ? ` · ${up} of ${total} online servers reachable` : "");
  else if (total && up === 0) text = "Connecting to the online servers…";
  else text = `Online · ${up} of ${total} servers reachable · waiting for your friend`;
  $("#lobby-transport").textContent = text;
  // Small print: each network's reach, and where the friend was heard (helps fix connection problems)
  const label: Record<string, string> = { nostr: "Direct (Nostr)", torrent: "Direct (trackers)", relay: "Relays", mqtt: "Brokers", claude: "claude.ai", local: "This device" };
  $("#lobby-diag").textContent =
    r
      .status()
      .filter((x) => x.name !== "local" || x.heard)
      .map((x) => `${label[x.name] ?? x.name} ${x.total ? `${x.up}/${x.total}` : ""}${x.heard ? " ✓" : ""}`.trim())
      .join(" · ") + ` · build ${__BUILD__}`;
}

function onPeers(peers: NetPeer[]) {
  if (!net) return;
  const had = !!net.opp;
  net.opp = peers.find((p) => !p.isMe && p.presence.app === "pc") ?? null;
  if (had !== !!net.opp) syncTransport();
  // The other player left
  if (had && !net.opp && net.matchId && !net.over) {
    showBanner(`${oppName()} left`, false);
    net.matchId = null;
    engine.phase = "idle";
    window.setTimeout(backToLobby, 1500);
    return;
  }
  const o = opp();
  // The guest follows the host into a match (and into rematches)
  if (net.opp && !net.host && typeof o.match === "string" && o.match !== net.lastMatch) startOnlineMatch(o.match);
  if (net.matchId) {
    applyRemote();
    reconcile();
  }
  if (net.waitCel && o.cel?.m === net.matchId && typeof o.cel.id === "string") {
    const go = net.waitCel;
    net.waitCel = null;
    go(celebrations.some((c) => c.id === o.cel!.id) ? o.cel.id : "siu");
  }
  if (!$("#lobby").hidden) renderLobby();
}

function renderLobby() {
  if (!net) return;
  const o = opp();
  const row = (nick: string, taker: Player, keeper: Player, ready: boolean, you: boolean) => {
    const li = document.createElement("li");
    li.innerHTML = `${face(taker)}<span><span class="lp-name"></span><span class="lp-picks"></span></span><span class="lp-ready${ready ? " on" : ""}">${ready ? "Ready" : "Not ready"}</span>`;
    li.querySelector(".lp-name")!.textContent = you ? `${nick} (you)` : nick;
    li.querySelector(".lp-picks")!.textContent = `Taker: ${taker.firstName} · Keeper: ${keeper.firstName}`;
    return li;
  };
  const list = $("#lobby-players");
  list.innerHTML = "";
  list.appendChild(row(save.nick || "You", byId(save.shooterId), byId(save.keeperId), net.ready, true));
  if (net.opp) list.appendChild(row(oppName(), byId(safeId(o.taker, "elias")), byId(safeId(o.keeper, "debika")), !!o.ready, false));
  $("#lobby-status").textContent = net.opp
    ? net.host
      ? o.ready && net.ready
        ? "Both ready. Start when you like."
        : "Pick your players, then both press Ready."
      : "Waiting for the host to start."
    : `Share the code ${net.room.code} with your friend. They open this page, choose Play online and join.${
        net.room.transports.length > 1
          ? " Use the same game link, and if you can’t see each other after 30 seconds, try another network (a phone hotspot works): some school and office Wi-Fi blocks direct connections."
          : ""
      }`;
  $("#lobby-settings").hidden = !net.host;
  const s = settings();
  const meStart = s.hostRole === "shoot" ? (net.host ? "striker" : "goalkeeper") : net.host ? "goalkeeper" : "striker";
  $("#lobby-format").textContent = `${s.format === "duel" ? "Striker vs keeper, 5 kicks: 4 goals wins for the striker, 2 stops for the keeper" : "Full shootout, taking turns"} · you start as ${meStart}.`;
  ($("#lobby-start") as HTMLButtonElement).disabled = !(net.host && net.opp && net.ready && o.ready);
  $("#lobby-start").hidden = !net.host;
  const rb = $("#lobby-ready");
  rb.setAttribute("aria-pressed", String(net.ready));
  rb.textContent = net.ready ? "Ready ✓" : "I’m ready";
}

function syncLobbySettings() {
  document.querySelectorAll<HTMLInputElement>("input[name=format]").forEach((r) => (r.checked = r.value === hostFormat));
  document.querySelectorAll<HTMLInputElement>("input[name=hostrole]").forEach((r) => (r.checked = r.value === hostStartRole));
}
document.querySelectorAll<HTMLInputElement>("input[name=format]").forEach((r) =>
  r.addEventListener("change", () => {
    hostFormat = r.value === "shootout" ? "shootout" : "duel";
    net?.room.setPresence({ format: hostFormat });
    renderLobby();
  }),
);
document.querySelectorAll<HTMLInputElement>("input[name=hostrole]").forEach((r) =>
  r.addEventListener("change", () => {
    hostStartRole = r.value === "keep" ? "keep" : "shoot";
    net?.room.setPresence({ hostRole: hostStartRole });
    renderLobby();
  }),
);
$("#lobby-ready").addEventListener("click", () => {
  if (!net) return;
  net.ready = !net.ready;
  net.room.setPresence({ ready: net.ready });
  renderLobby();
});
$("#lobby-pick").addEventListener("click", () => {
  mode = "online";
  openSelect();
});
$("#lobby-start").addEventListener("click", () => {
  if (!net?.host) return;
  const id = Math.random().toString(36).slice(2, 10);
  net.room.setPresence({ match: id, k: 0, shot: null, dive: null, kx: null, res: null });
  startOnlineMatch(id);
});
$("#lobby-leave").addEventListener("click", () => {
  leaveOnline();
  syncMenu();
  show("menu");
});
$("#to-lobby").addEventListener("click", backToLobby);

function backToLobby() {
  if (!net) return show("menu");
  net.matchId = null;
  net.ready = false;
  net.room.setPresence({ ready: false, shot: null, dive: null, kx: null, res: null, ...(net.host ? { match: null } : {}) });
  engine.phase = "idle";
  engine.online = false;
  sfx.stopAmbience();
  renderLobby();
  show("lobby");
}

function leaveOnline() {
  net?.room.leave();
  net = null;
  engine.online = false;
  engine.holdShot = false;
  $("#to-lobby").hidden = true;
}

function startOnlineMatch(id: string) {
  if (!net) return;
  net.matchId = id;
  net.lastMatch = id;
  net.k = 0;
  net.hostShots = [];
  net.guestShots = [];
  net.outcomes = [];
  net.kicks = [];
  net.over = false;
  net.waitCel = null;
  window.clearInterval(pickTimer);
  matchUnlocks = [];
  engine.setDifficulty("easy");
  $("#practice-switch").hidden = true;
  $("#pause").hidden = true;
  $("#team-cpu").hidden = false;
  $("#team-cpu .team-name").textContent = oppName();
  show("hud");
  sfx.startAmbience();
  onlineKick();
}

function onlineKick() {
  if (!net) return;
  clearBanner();
  const k = net.k;
  const role = myRole(k);
  const striker = picksOf(strikerSide(k)).taker;
  const keeper = picksOf(strikerSide(k) === "host" ? "guest" : "host").keeper;
  engine.setCast(striker, keeper);
  engine.startKick(role, true);
  engine.snapCamera();
  net.seenDive = "";
  net.room.setPresence({ k, shot: null, dive: null, kx: null, res: null });
  $("#who-shoot").innerHTML = `${face(striker)}<span></span>`;
  $("#who-shoot span").textContent = `${striker.firstName} (${role === "shoot" ? "you" : oppName()})`;
  $("#who-keep").innerHTML = `${face(keeper)}<span></span>`;
  $("#who-keep span").textContent = `${keeper.firstName} (${role === "keep" ? "you" : oppName()})`;
  $("#meters").hidden = role !== "shoot";
  $("#shuffle").hidden = role !== "keep";
  updateOnlineBoard();
  startTutorial(role);
  commentateOnline(striker, keeper);
  applyRemote();
}

/** Read the other player's latest state into this kick. */
function applyRemote() {
  if (!net?.matchId) return;
  const o = opp();
  const k = net.k;
  if (myRole(k) === "shoot") {
    // Don't let the striker go before the keeper is on this kick
    const waiting = o.k !== k;
    if (waiting !== engine.holdShot) {
      engine.holdShot = waiting;
      if (engine.phase === "aim") $("#hint").textContent = waiting ? `Waiting for ${oppName()} to get in goal…` : "Aim, hold Space to charge, release to shoot.";
    }
    if (o.kx?.k === k && typeof o.kx.x === "number") engine.remoteKeeperX(Math.max(-1.4, Math.min(1.4, o.kx.x)));
    if (o.dive?.k === k) {
      const key = JSON.stringify(o.dive);
      if (key !== net.seenDive) {
        net.seenDive = key;
        engine.remoteDive(o.dive);
      }
    }
    if (o.res?.k === k) engine.remoteResultIn(o.res);
  } else {
    engine.holdShot = false;
    if (o.shot?.k === k && engine.phase === "ready") engine.remoteShot(o.shot);
  }
}

engine.onLocalShot = (shot) => net?.room.setPresence({ shot: { ...shot, k: net.k } });
engine.onLocalDive = (dive) => net?.room.setPresence({ dive: { ...dive, k: net.k } });
engine.onLocalKeeperX = (x) => net?.room.setPresence({ kx: { k: net.k, x: Math.round(x * 100) / 100 } });
engine.onLocalResult = (r) => net?.room.setPresence({ res: { ...r, k: net.k } });

function onlineResult(r: KickResult) {
  if (!net) return;
  net.kicks.push(r);
  net.outcomes[net.k] = r.outcome === "goal";
  rebuildShots();
  // As keeper, publish the full record so the striker's screen can match it
  if (r.role === "keep") {
    const rec: Record<string, number> = {};
    net.outcomes.forEach((g, k) => {
      if (myRole(k) === "keep") rec[k] = g ? 1 : 0;
    });
    net.room.setPresence({ log: { m: net.matchId, r: rec } });
  }
  if (r.role === "shoot") {
    save.totals.shots++;
    if (r.outcome === "goal") save.totals.goals++;
  } else {
    save.totals.faced++;
    if (r.outcome !== "goal") save.totals.saves++;
  }
  if (r.role === "shoot" && r.outcome === "goal" && r.perfect) save.totals.perfect++;
  persist();
  kickAchievements(r);
  resultBuzz(r);
  showBanner(r.label, r.good);
  updateOnlineBoard();
  $("#live").textContent = r.label;
  finishTutorialStep();
}

function onlineKickDone() {
  if (!net) return;
  reconcile();
  net.k++;
  const d = onlineDecided();
  if (d) finishOnline(d);
  else onlineKick();
}

function rebuildShots() {
  if (!net) return;
  net.hostShots = [];
  net.guestShots = [];
  net.outcomes.forEach((g, k) => (strikerSide(k) === "host" ? net!.hostShots : net!.guestShots).push(g));
}

/** Striker: if a kick was called here before the keeper's verdict arrived, take the keeper's. */
function reconcile() {
  if (!net?.matchId || net.over) return;
  const log = opp().log;
  if (!log || log.m !== net.matchId || typeof log.r !== "object") return;
  let changed = false;
  for (const [key, v] of Object.entries(log.r)) {
    const k = Number(key);
    if (!Number.isInteger(k) || myRole(k) !== "shoot" || net.outcomes[k] === undefined) continue;
    if (net.outcomes[k] !== (v === 1)) {
      net.outcomes[k] = v === 1;
      changed = true;
    }
  }
  if (changed) {
    rebuildShots();
    updateOnlineBoard();
  }
}

function shotsOf(side: Side) {
  return side === "host" ? net!.hostShots : net!.guestShots;
}

function onlineDecided(): Side | "done" | null {
  if (!net) return null;
  if (settings().format === "duel") return net.k >= 5 ? "done" : null;
  const h = shotsOf("host");
  const g = shotsOf("guest");
  const y = goals(h);
  const c = goals(g);
  if (h.length <= 5 && g.length <= 5 && !(h.length === 5 && g.length === 5)) {
    if (y > c + (5 - g.length)) return "host";
    if (c > y + (5 - h.length)) return "guest";
    return null;
  }
  if (h.length === g.length && y !== c) return y > c ? "host" : "guest";
  return null;
}

function updateOnlineBoard() {
  if (!net) return;
  const me = shotsOf(mySide());
  const them = shotsOf(mySide() === "host" ? "guest" : "host");
  const duel = settings().format === "duel";
  const sudden = !duel && me.length >= 5 && them.length >= 5;
  const slots = sudden ? Math.max(me.length, them.length) + (me.length === them.length ? 1 : 0) : 5;
  const iShoot = strikerSide(0) === mySide();
  $("#dots-you").innerHTML = dots(me, duel && !iShoot ? 0 : slots);
  $("#dots-cpu").innerHTML = dots(them, duel && iShoot ? 0 : slots);
  $("#score").textContent = duel ? `${goals(iShoot ? me : them)} / 5` : `${goals(me)} – ${goals(them)}`;
  const turn = myRole(net.k) === "shoot" ? "you shoot" : "you save";
  $("#status").textContent = duel ? `Kick ${Math.min(net.k + 1, 5)} of 5 · ${turn}` : sudden ? `Sudden death · ${turn}` : `Round ${Math.min(Math.floor(net.k / 2) + 1, 5)} · ${turn}`;
}

/** Which side won: in a duel the striker needs 4 goals, otherwise the keeper wins. */
function onlineWinnerSide(result: Side | "done"): Side {
  if (result !== "done") return result;
  const first = strikerSide(0);
  const other: Side = first === "host" ? "guest" : "host";
  return strikerWon(goals(shotsOf(first))) ? first : other;
}

function finishOnline(result: Side | "done") {
  if (!net) return;
  net.over = true;
  $("#status").textContent = "Full time";
  engine.holdShot = false;
  const duel = settings().format === "duel";
  const win = onlineWinnerSide(result);
  const lose: Side = win === "host" ? "guest" : "host";
  // Who celebrates: the winning striker (or, in a duel won in goal, the keeper)
  const winnerKeeps = duel && win !== strikerSide(0);
  const winner: Celebrant = { player: winnerKeeps ? picksOf(win).keeper : picksOf(win).taker, keeper: winnerKeeps };
  const loser: Celebrant = { player: winnerKeeps ? picksOf(lose).taker : picksOf(lose).keeper, keeper: !winnerKeeps };
  const matchId = net.matchId;
  const run = (id: string) => {
    if (!net || net.matchId !== matchId) return;
    playCelebration(winner, loser, id, () => endOnline(result));
  };
  if (win === mySide()) {
    pickCelebration("You win", (id) => {
      net?.room.setPresence({ cel: { m: matchId, id } });
      run(id);
    });
  } else {
    // Wait for the winner's choice (or pick for them if it doesn't arrive)
    showBanner(`${oppName()} wins!`, false);
    $("#hint").textContent = `${oppName()} is choosing a celebration…`;
    $("#meters").hidden = true;
    $("#shuffle").hidden = true;
    let started = false;
    const go = (id: string) => {
      if (started) return;
      started = true;
      net && (net.waitCel = null);
      $("#hint").textContent = "";
      run(id);
    };
    net.waitCel = go;
    const o = opp();
    if (o.cel?.m === matchId) go(o.cel.id);
    window.setTimeout(() => go(cpuCelebration()), 15000);
  }
}

function endOnline(result: Side | "done") {
  if (!net) return;
  net.over = true;
  engine.holdShot = false;
  achieve("online");
  sfx.stopAmbience();
  const duel = settings().format === "duel";
  const iShoot = strikerSide(0) === mySide();
  const me = shotsOf(mySide());
  const them = shotsOf(mySide() === "host" ? "guest" : "host");
  let title: string;
  let line: string;
  let score: string;
  if (duel) {
    const scored = goals(iShoot ? me : them);
    score = `${scored} / 5`;
    title = strikerWon(scored) ? "STRIKER WINS!" : "KEEPER WINS!";
    if (iShoot) line = `You scored ${scored} of 5 against ${oppName()}. The striker needs 4.`;
    else line = `You kept out ${5 - scored} of 5 from ${oppName()}. The keeper needs 2.`;
    shareText = iShoot ? `I scored ${scored} of 5 penalties against ${oppName()} online.` : `I kept out ${5 - scored} of 5 penalties from ${oppName()} online.`;
  } else {
    const won = result === mySide();
    title = won ? "SHOOTOUT WINNER!" : `${oppName()} wins`;
    score = `${goals(me)} – ${goals(them)}`;
    line = me.length > 5 ? (won ? "Won in sudden death." : "Lost in sudden death.") : won ? "Southwestern bragging rights are yours." : "Rematch?";
    shareText = `I ${won ? "beat" : "lost to"} ${oppName()} ${goals(me)}–${goals(them)} in an online shootout.`;
    if (won) sfx.crowd("cheer", true);
  }
  $("#end-kicker").textContent = `Online · vs ${oppName()}`;
  $("#end-title").textContent = title;
  $("#end-score").textContent = score;
  $("#end-line").textContent = line;
  $("#end-stats").innerHTML = "";
  showAward(net.kicks, onlineWinnerSide(result) === mySide());
  const rematch = $("#rematch") as HTMLButtonElement;
  rematch.disabled = !net.host;
  rematch.textContent = net.host ? "Rematch" : "Waiting for host…";
  $("#to-lobby").hidden = false;
  show("end");
}

function onlineRematch() {
  if (!net?.host) return;
  const id = Math.random().toString(36).slice(2, 10);
  net.room.setPresence({ match: id, k: 0, shot: null, dive: null, kx: null, res: null });
  startOnlineMatch(id);
}

/* Invite links: the code travels in the link, so a friend lands on the right page and joins at once */
const PUBLIC_GAME = "https://codydiezz-droid.github.io/Battle-of-the-Brains/penalty-club/";
function inviteLink(code: string) {
  const here = location.protocol.startsWith("http") && location.hostname.endsWith("github.io") ? location.origin + location.pathname : PUBLIC_GAME;
  return `${here}?join=${code}`;
}
$("#lobby-invite").addEventListener("click", async () => {
  if (!net) return;
  const url = inviteLink(net.room.code);
  const text = `Play me in OneBridge Penalty Club. Game ${net.room.code}:`;
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) await navigator.share({ title: "OneBridge Penalty Club", text, url });
    else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast("Invite link copied. Send it to your friend.");
    }
  } catch {
    /* share sheet closed */
  }
});

/* ───────────────────────────── Start ───────────────────────────── */

// The two favourite players stand on the pitch behind the menu
engine.setCast(byId(save.shooterId), byId(save.keeperId));
syncMenu();
show("menu");

// Fetch the online code in the background, so joining a game is quick
(window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1500)))(() => warmUp());

// Opened from an invite link: go straight into that game
const invited = new URLSearchParams(location.search).get("join")?.toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
if (invited.length === 4) {
  history.replaceState(null, "", location.pathname + location.search.replace(/[?&]join=[^&]*/, "").replace(/^&/, "?"));
  mode = "online";
  ($("#nick") as HTMLInputElement).value = save.nick;
  show("online");
  void joinAs(invited, false);
}
