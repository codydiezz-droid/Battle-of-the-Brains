import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/public-sans";
import "./penalty.css";
import { DIFF, type Difficulty } from "./ai";
import * as sfx from "./audio";
import { Engine, type KickResult, type Role } from "./game";
import { byId, roster, type Player } from "./players";
import { persist, save } from "./storage";
import { cardPortrait } from "./textures";

type Mode = "challenge" | "keeper" | "shootout" | "practice";

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const siteUrl = document.body.dataset.siteUrl || "../";
document.querySelectorAll<HTMLAnchorElement>("[data-site-link]").forEach((a) => (a.href = siteUrl));

const engine = new Engine($<HTMLCanvasElement>("#pitch"));
// ?debug exposes the engine for automated play-testing
if (new URLSearchParams(location.search).has("debug")) (window as unknown as { pcEngine: Engine }).pcEngine = engine;
sfx.setMuted(save.muted);

/* ───────────────────────────── Screens ───────────────────────────── */

const screens = ["menu", "select", "hud", "paused", "end"] as const;
type Screen = (typeof screens)[number];
function show(...visible: Screen[]) {
  for (const s of screens) $(`#${s}`).hidden = !visible.includes(s);
  const top = visible[visible.length - 1];
  $(`#${top}`).querySelector<HTMLElement>("[data-autofocus]")?.focus();
}

/* ───────────────────────────── Menu ───────────────────────────── */

let mode: Mode = "challenge";

function syncMenu() {
  document.querySelectorAll<HTMLInputElement>("input[name=diff]").forEach((r) => (r.checked = r.value === save.difficulty));
  const d = save.difficulty;
  $("[data-best=challenge]").textContent = `Best on ${DIFF[d].label}: ${save.best.challenge[d]} / 5`;
  $("[data-best=keeper]").textContent = `Best on ${DIFF[d].label}: ${save.best.keeper[d]} saves`;
  $("[data-best=shootout]").textContent = `Record: ${save.shootout.wins} won, ${save.shootout.losses} lost`;
  const acc = save.totals.shots ? Math.round((save.totals.goals / save.totals.shots) * 100) : 0;
  const sv = save.totals.faced ? Math.round((save.totals.saves / save.totals.faced) * 100) : 0;
  $("[data-best=practice]").textContent = save.totals.shots || save.totals.faced ? `Career: ${acc}% scored, ${sv}% saved` : "No kicks yet";
  syncSound();
}

document.querySelectorAll<HTMLInputElement>("input[name=diff]").forEach((r) =>
  r.addEventListener("change", () => {
    save.difficulty = r.value as Difficulty;
    persist();
    syncMenu();
  }),
);

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
  if (mode === "challenge") return ["shoot", "cpuKeep"];
  if (mode === "keeper") return ["keep", "cpuShoot"];
  return ["shoot", "keep", "cpuShoot", "cpuKeep"];
}

function openSelect() {
  const used = slots();
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) => (b.hidden = !used.includes(b.dataset.tab as Slot)));
  tab = used[0];
  $("#select-title").textContent = "Pick the players";
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
  syncMenu();
  show("menu");
});
$("#kickoff").addEventListener("click", () => startMatch());

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
  if (mode === "keeper") match.practiceRole = "keep";
  engine.setDifficulty(save.difficulty);
  engine.resetMemory();
  $("#practice-switch").hidden = mode !== "practice";
  $("#team-cpu").hidden = mode !== "shootout";
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

function nextKick() {
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
}

const faceCache = new Map<string, string>();
function face(p: Player) {
  if (!faceCache.has(p.id)) faceCache.set(p.id, cardPortrait(p, 36, false).toDataURL());
  return `<img src="${faceCache.get(p.id)}" alt="" width="36" height="36" />`;
}

engine.onHint = (text) => ($("#hint").textContent = text);

engine.onResult = (r) => {
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
  showBanner(r.label, r.good);
  updateBoard();
  $("#live").textContent = `${r.label} ${boardText()}`;
  finishTutorialStep();
};

engine.onKickDone = () => {
  $("#banner").hidden = true;
  if (match.over) return;
  const decided = matchDecided();
  if (decided) endMatch(decided);
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
function matchDecided(): "you" | "cpu" | "done" | null {
  const m = match;
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

function updateBoard() {
  const m = match;
  const sudden = m.mode === "shootout" && m.you.length >= 5 && m.cpu.length >= 5;
  if (m.mode === "challenge" || (m.mode === "practice" && m.practiceRole === "shoot")) {
    $("#dots-you").innerHTML = dots(m.mode === "practice" ? m.you.slice(-5) : m.you, 5);
    $("#score").textContent = m.mode === "practice" ? `${goals(m.you)} / ${m.you.length}` : `${goals(m.you)} / 5`;
    $("#status").textContent = m.mode === "practice" ? "Practice · shooting" : `Penalty ${Math.min(m.you.length + 1, 5)} of 5`;
  } else if (m.mode === "keeper" || (m.mode === "practice" && m.practiceRole === "keep")) {
    // For a keeper, green is a stop
    const saves = m.cpu.map((g) => !g);
    $("#dots-you").innerHTML = dots(m.mode === "practice" ? saves.slice(-5) : saves, 5);
    $("#score").textContent = m.mode === "practice" ? `${goals(saves)} / ${saves.length} saved` : `${goals(saves)} saved`;
    $("#status").textContent = m.mode === "practice" ? "Practice · in goal" : `Penalty ${Math.min(m.cpu.length + 1, 5)} of 5`;
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

function endMatch(result: "you" | "cpu" | "done") {
  match.over = true;
  sfx.stopAmbience();
  const m = match;
  const d = save.difficulty;
  let title = "";
  let kicker = `${DIFF[d].label} · `;
  let score = "";
  let line = "";
  let best = false;
  if (m.mode === "challenge") {
    const n = goals(m.you);
    kicker += "Penalty Challenge";
    title = n === 5 ? "PERFECT FIVE!" : `${n} from 5`;
    score = `${n} / 5`;
    line = ["The keeper had your number.", "One goal. Work on your timing.", "Two goals. Aim further from the keeper.", "Three goals. Solid.", "Four from five. Ice cold.", "Five from five. Clinical."][n];
    if (n > save.best.challenge[d]) {
      save.best.challenge[d] = n;
      best = true;
    }
  } else if (m.mode === "keeper") {
    const n = m.cpu.filter((g) => !g).length;
    kicker += "Goalkeeper Challenge";
    title = n >= 4 ? "A WALL!" : `${n} kept out`;
    score = `${n} / 5`;
    line = ["They found the corners every time.", "One stop. Watch the hips at the plant.", "Two stops. Dive as the ball is struck.", "Three stops. A proper keeper.", "Four stops. Outstanding.", "Clean sheet. Unbeatable."][n];
    if (n > save.best.keeper[d]) {
      save.best.keeper[d] = n;
      best = true;
    }
  } else {
    kicker += "Full Shootout";
    const won = result === "you";
    title = won ? "SHOOTOUT WINNER!" : "Shootout lost";
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
  show("end");
}

$("#rematch").addEventListener("click", startMatch);
$("#end-menu").addEventListener("click", () => {
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
  if ($("#hud").hidden || engine.paused) return;
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
  { id: "aim", text: "Move the mouse (or arrow keys) to aim at the goal." },
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

/* ───────────────────────────── Start ───────────────────────────── */

// The two favourite players stand on the pitch behind the menu
engine.setCast(byId(save.shooterId), byId(save.keeperId));
syncMenu();
show("menu");
