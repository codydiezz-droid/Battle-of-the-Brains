import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/public-sans";
import "./penalty.css";
import * as sfx from "./audio";
import { roster, type Player } from "./players";
import {
  BALL_R,
  GOAL_H,
  GOAL_HALF,
  GOAL_Z,
  SPOT_Z,
  drawBackdrop,
  drawBall,
  drawGoal,
  drawPlayer,
  drawReticle,
  makeView,
  project,
  toGoalPlane,
  type Pose,
  type View,
} from "./render";

/* ───────────────────────────── Setup ───────────────────────────── */

const KICKS = 5;
const KEEPER_Z = GOAL_Z - 0.3;
const KEEPER_H = 1.9; // drawn height in metres (big heads read better)
const IDLE_Y = KEEPER_H * 0.45;

// Faces come from the team site's portraits, one folder up on GitHub Pages.
const imgBase: string = import.meta.env.VITE_PC_IMG_BASE ?? "../";
const faceUrl = (p: Player) => imgBase + p.face.replace(/^\//, "");
const faces = new Map<string, HTMLImageElement>();
for (const p of roster) {
  const img = new Image();
  img.decoding = "async";
  img.src = faceUrl(p);
  faces.set(p.id, img);
}

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const canvas = $<HTMLCanvasElement>("#pitch");
const ctx = canvas.getContext("2d")!;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const siteUrl = document.body.dataset.siteUrl || "../";
document.querySelectorAll<HTMLAnchorElement>("[data-site-link]").forEach((a) => (a.href = siteUrl));

let view: View = makeView(1000, 625);
let scale = 1;
let offsetX = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  canvas.style.width = cw + "px";
  canvas.style.height = ch + "px";
  // Phones in portrait zoom in so the goal fills most of the width.
  const w = ch > cw ? 720 : 1000;
  scale = cw / w;
  let h = ch / scale;
  offsetX = 0;
  if (h < 560) {
    // Very wide screens: fit the height and centre the scene.
    scale = ch / 560;
    h = 560;
    offsetX = (cw - w * scale) / 2;
  }
  view = makeView(w, h);
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, 0);
}
window.addEventListener("resize", resize);
resize();

/* ───────────────────────────── State ───────────────────────────── */

type Role = "striker" | "keeper";
type Outcome = "goal" | "save" | "miss" | "post";
type Phase = "idle" | "aim" | "power" | "runup" | "flight" | "after";

interface Dive {
  tx: number;
  ty: number;
  start: number;
  dur: number;
}

const state = {
  role: "striker" as Role,
  you: roster[0],
  opp: roster[1],
  round: 0,
  results: [] as Outcome[],
  phase: "idle" as Phase,
  phaseStart: 0,
  aim: { x: 0, y: 1.2 },
  power: 0,
  // Ball flight
  shot: { tx: 0, ty: 0, dur: 0.8, arc: 0.4, curve: 0, start: 0 },
  ball: { x: 0, y: 0, z: SPOT_Z, spin: 0 },
  after: null as null | { from: { x: number; y: number; z: number }; to: { x: number; y: number; z: number }; start: number; dur: number; bounce: number },
  dive: null as Dive | null,
  // A keeper-mode guess made before the kick
  earlyGuess: null as null | { x: number; y: number },
  outcome: null as Outcome | null,
  ripple: null as null | { x: number; y: number; k: number },
  flash: 0,
};

const now = () => performance.now() / 1000;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

const keeperPlayer = () => (state.role === "keeper" ? state.you : state.opp);
const strikerPlayer = () => (state.role === "striker" ? state.you : state.opp);

/* ──────────────────────────── Screens ──────────────────────────── */

const screens = ["title", "select", "hud", "end"] as const;
type Screen = (typeof screens)[number];

function show(screen: Screen) {
  for (const s of screens) {
    const el = $(`#${s}`);
    el.hidden = s !== screen;
  }
  const focusTarget = $(`#${screen}`).querySelector<HTMLElement>("[data-autofocus]");
  focusTarget?.focus();
}

// Title
document.querySelectorAll<HTMLButtonElement>("[data-role]").forEach((b) =>
  b.addEventListener("click", () => {
    state.role = b.dataset.role as Role;
    openSelect();
  }),
);

/* Player select */
const grid = $("#players");
const selectTitle = $("#select-title");
const oppName = $("#opp-name");
let picked: Player | null = null;

function miniCanvas(p: Player, w = 132, h = 164) {
  const c = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = w * dpr;
  c.height = h * dpr;
  c.style.width = w + "px";
  c.style.height = h + "px";
  c.setAttribute("aria-hidden", "true");
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  const draw = () => {
    g.clearRect(0, 0, w, h);
    drawPlayer(g, p, faces.get(p.id), w / 2, h - 8, h - 14, { angle: 0, arms: 0.2, reach: 0 }, false);
  };
  draw();
  const img = faces.get(p.id)!;
  if (!img.complete) img.addEventListener("load", draw, { once: true });
  return c;
}

function statBar(label: string, value: number) {
  return `<span class="stat"><span>${label}</span><span class="pips" aria-label="${value} out of 5">${[1, 2, 3, 4, 5]
    .map((i) => `<i class="${i <= value ? "on" : ""}"></i>`)
    .join("")}</span></span>`;
}

function openSelect() {
  selectTitle.textContent = state.role === "striker" ? "Pick your penalty taker" : "Pick your goalkeeper";
  grid.innerHTML = "";
  picked = null;
  for (const p of roster) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "card";
    b.setAttribute("aria-pressed", "false");
    b.dataset.id = p.id;
    const s = p.stats;
    const stats =
      state.role === "striker"
        ? statBar("Power", s.power) + statBar("Accuracy", s.accuracy)
        : statBar("Reflexes", s.reflex) + statBar("Reach", s.reach);
    b.innerHTML = `<span class="card-art"></span>
      <span class="card-name">${p.name}</span>
      <span class="card-kit"><span aria-hidden="true">${p.flag}</span> ${p.kit.label} · ${p.number}</span>
      <span class="card-style">${p.style}</span>
      <span class="card-stats">${stats}</span>`;
    b.querySelector(".card-art")!.appendChild(miniCanvas(p));
    b.addEventListener("click", () => pick(p));
    grid.appendChild(b);
  }
  pick(roster[Math.floor(Math.random() * roster.length)]);
  show("select");
  grid.querySelector<HTMLButtonElement>(".card[aria-pressed=true]")?.focus();
}

function pick(p: Player) {
  picked = p;
  grid.querySelectorAll<HTMLButtonElement>(".card").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === p.id)));
  if (state.opp.id === p.id) shuffleOpponent();
  else updateOpp();
}

function shuffleOpponent() {
  const pool = roster.filter((r) => r.id !== picked?.id && r.id !== state.opp.id);
  state.opp = pool[Math.floor(Math.random() * pool.length)];
  updateOpp();
}

function updateOpp() {
  oppName.textContent = `${state.opp.name} (${state.opp.kit.label})`;
  $("#opp-role").textContent = state.role === "striker" ? "In goal" : "Taking the penalties";
}

$("#shuffle").addEventListener("click", shuffleOpponent);
$("#back-title").addEventListener("click", () => show("title"));
$("#kickoff").addEventListener("click", () => {
  if (!picked) return;
  state.you = picked;
  startMatch();
});

/* HUD */
const hint = $("#hint");
const live = $("#live");
const banner = $("#banner");
const powerWrap = $("#power");
const powerMarker = $("#power-marker");
const dots = $("#dots");
const roundLabel = $("#round");

function setHud() {
  const fill = (id: string, p: Player, role: string) => {
    const el = $(id);
    el.querySelector<HTMLImageElement>("img")!.src = faceUrl(p);
    el.querySelector(".hud-name")!.textContent = p.shirtName;
    el.querySelector(".hud-role")!.textContent = role;
    el.style.setProperty("--kit", p.kit.shirt);
    el.style.setProperty("--trim", p.kit.trim);
  };
  fill("#hud-you", state.you, state.role === "striker" ? "You · striker" : "You · keeper");
  fill("#hud-opp", state.opp, state.role === "striker" ? "Keeper" : "Striker");
  dots.innerHTML = Array.from({ length: KICKS }, (_, i) => {
    const r = state.results[i];
    const good = r && (state.role === "striker" ? r === "goal" : r !== "goal");
    const label = r ? (good ? "scored" : "missed") : "to come";
    const cls = r ? (good ? "good" : "bad") : "";
    return `<i class="${cls}" title="Penalty ${i + 1}: ${label}"></i>`;
  }).join("");
  const done = state.results.length;
  roundLabel.textContent = `Penalty ${Math.min(done + 1, KICKS)} of ${KICKS}`;
}

$("#mute").addEventListener("click", () => {
  sfx.setMuted(!sfx.isMuted());
  syncMute();
});
function syncMute() {
  const m = sfx.isMuted();
  $("#mute").setAttribute("aria-pressed", String(m));
  $("#mute").setAttribute("aria-label", m ? "Turn sound on" : "Turn sound off");
  $("#mute").textContent = m ? "Sound off" : "Sound on";
}
syncMute();
$("#quit").addEventListener("click", () => {
  state.phase = "idle";
  show("title");
});

/* ───────────────────────────── Match ───────────────────────────── */

function startMatch() {
  state.round = 0;
  state.results = [];
  setHud();
  show("hud");
  canvas.focus();
  sfx.whistle();
  nextKick();
}

function resetBall() {
  state.ball = { x: 0, y: 0, z: SPOT_Z, spin: 0 };
  state.after = null;
  state.dive = null;
  state.earlyGuess = null;
  state.outcome = null;
  state.ripple = null;
}

function setPhase(p: Phase) {
  state.phase = p;
  state.phaseStart = now();
}

function nextKick() {
  resetBall();
  banner.hidden = true;
  if (state.role === "striker") {
    setPhase("aim");
    hint.textContent = "Move to aim, then tap (or press Space) to lock it in.";
  } else {
    setPhase("runup");
    hint.textContent = "Tap where you’ll dive. Too early and the striker may read you.";
  }
  setHud();
}

/* Striker mode */

function lockAim() {
  if (state.phase !== "aim") return;
  setPhase("power");
  powerWrap.hidden = false;
  hint.textContent = "Tap when the marker is in the gold zone.";
}

const SWEET = { mid: 0.74, half: 0.11 };

function shoot() {
  if (state.phase !== "power") return;
  const p = state.power;
  powerWrap.hidden = true;
  const me = state.you.stats;
  const off = Math.max(0, Math.abs(p - SWEET.mid) - SWEET.half);
  const sigma = Math.max(0.05, 0.14 + off * 1.6 - me.accuracy * 0.022);
  const tx = state.aim.x + gauss() * sigma;
  let ty = state.aim.y + gauss() * sigma * 0.8;
  if (p > SWEET.mid + SWEET.half) ty += (p - (SWEET.mid + SWEET.half)) * 7; // leaning back: it flies
  if (p < 0.35) ty = Math.min(ty, 0.6);
  ty = Math.max(BALL_R, ty);
  const dur = clamp(1.0 - p * 0.42 - me.power * 0.03, 0.48, 1.1);
  launch(tx, ty, dur, 0.18 + (1 - p) * 0.5);

  // The keeper reads it, or guesses
  const k = state.opp.stats;
  const reads = Math.random() < 0.26 + k.reflex * 0.025;
  let gx: number;
  let gy: number;
  if (reads) {
    gx = tx + gauss() * 0.5;
    gy = ty + gauss() * 0.4;
  } else {
    const side = Math.random() < 0.16 ? 0 : Math.random() < 0.5 ? -1 : 1;
    gx = side * rand(1.4, 3.0);
    gy = rand(0.35, 1.9);
  }
  startDive(gx, gy, now() + rand(0.1, 0.22), k);
}

/* Keeper mode */

function aiShot() {
  const s = state.opp.stats;
  let tx: number;
  let ty: number;
  if (Math.random() < 0.08) {
    // Pulled wide or over
    tx = (Math.random() < 0.5 ? -1 : 1) * rand(3.7, 4.4);
    ty = rand(0.3, 2.2);
  } else if (Math.random() < 0.22) {
    tx = rand(-1, 1);
    ty = rand(0.2, 2.1);
  } else {
    tx = (Math.random() < 0.5 ? -1 : 1) * rand(1.8, 3.35);
    ty = rand(0.2, 2.15);
  }
  // A keeper who moved early gets punished half the time
  if (state.earlyGuess && Math.random() < 0.5) {
    tx = -Math.sign(state.earlyGuess.x || 1) * rand(1.8, 3.3);
  }
  const dur = clamp(0.92 - s.power * 0.04 - state.round * 0.02, 0.62, 0.95);
  launch(tx, ty, dur, rand(0.15, 0.45));
  if (state.earlyGuess) startDive(state.earlyGuess.x, state.earlyGuess.y, now(), state.you.stats);
  hint.textContent = state.dive ? "You’re committed!" : "Dive! Tap where the ball is going.";
}

function playerDive(x: number, y: number) {
  if (state.role !== "keeper") return;
  if (state.phase === "runup" && !state.earlyGuess) {
    state.earlyGuess = { x, y };
    hint.textContent = "Guess locked in. Wait for the kick…";
  } else if (state.phase === "flight" && !state.dive) {
    startDive(x, y, now(), state.you.stats);
  }
}

/* Shared */

function launch(tx: number, ty: number, dur: number, arc: number) {
  state.shot = { tx, ty, dur, arc, curve: rand(-0.25, 0.25), start: now() };
  setPhase("flight");
  sfx.kick();
}

function startDive(x: number, y: number, start: number, stats: Player["stats"]) {
  const maxX = 2.9 + stats.reach * 0.12;
  state.dive = {
    tx: clamp(x, -maxX, maxX),
    ty: clamp(y, 0.3, 2.2),
    start,
    dur: 0.5 - stats.reflex * 0.03,
  };
}

/** Keeper body centre and hand point at time t. */
function keeperAt(t: number) {
  const idleX = state.phase === "aim" || state.phase === "power" || state.phase === "runup" ? Math.sin(t * 1.6) * 0.22 : 0;
  const d = state.dive;
  if (!d || t < d.start) return { x: idleX, y: IDLE_Y, p: 0, dir: 0 };
  const p = easeOut(clamp((t - d.start) / d.dur, 0, 1));
  const x = d.tx * p;
  const y = IDLE_Y + (d.ty - IDLE_Y) * p;
  return { x, y, p, dir: Math.sign(d.tx) };
}

function keeperPose(k: ReturnType<typeof keeperAt>): Pose {
  if (!state.dive || k.p === 0) return { angle: 0, arms: 0.3, reach: 0 };
  const d = state.dive;
  const lateral = clamp(d.tx / 3, -1, 1);
  const high = clamp((d.ty - 1.3) / 0.9, 0, 1);
  return { angle: lateral * 1.35 * (1 - high * 0.55) * k.p, arms: 0.3 + 0.7 * k.p, reach: k.dir };
}

function resolve(t: number) {
  const { tx, ty } = state.shot;
  const onTarget = Math.abs(tx) < GOAL_HALF - BALL_R && ty < GOAL_H - BALL_R;
  const nearPost = !onTarget && (Math.abs(Math.abs(tx) - GOAL_HALF) < BALL_R * 1.6 || Math.abs(ty - GOAL_H) < BALL_R * 1.6) && Math.abs(tx) < GOAL_HALF + 0.2 && ty < GOAL_H + 0.2;
  const k = keeperAt(t);
  const stats = keeperPlayer().stats;
  const handX = k.x + k.dir * 0.55 * k.p;
  const handY = k.y + 0.35 * k.p;
  const reach = 0.55 + stats.reach * 0.06;
  const saved =
    onTarget && (Math.hypot(tx - k.x, ty - k.y) < 0.62 || Math.hypot(tx - handX, ty - handY) < reach);

  const from = { x: tx, y: ty, z: KEEPER_Z };
  let outcome: Outcome;
  if (saved) {
    outcome = "save";
    state.after = { from, to: { x: tx + (Math.sign(tx) || 1) * rand(2.5, 4), y: 0, z: GOAL_Z - rand(4, 7) }, start: t, dur: 0.7, bounce: 1.2 };
    sfx.thud();
    sfx.crowd(state.role === "keeper" ? "cheer" : "groan");
  } else if (onTarget) {
    outcome = "goal";
    state.after = { from, to: { x: tx * 1.05, y: Math.max(BALL_R, ty * 0.6), z: GOAL_Z + 1.7 }, start: t, dur: 0.22, bounce: 0 };
    state.ripple = { x: tx, y: ty, k: 1 };
    state.flash = state.role === "striker" ? 1 : 0.4;
    sfx.crowd(state.role === "striker" ? "cheer" : "groan");
  } else if (nearPost) {
    outcome = "post";
    state.after = { from, to: { x: tx * 1.4, y: 0, z: GOAL_Z - 5 }, start: t, dur: 0.6, bounce: 0.8 };
    sfx.thud();
    sfx.crowd(state.role === "striker" ? "groan" : "cheer");
  } else {
    outcome = "miss";
    state.after = { from, to: { x: tx * 1.25, y: ty + 0.6, z: GOAL_Z + 9 }, start: t, dur: 0.5, bounce: 0 };
    sfx.crowd(state.role === "striker" ? "groan" : "cheer");
  }
  state.outcome = outcome;
  state.results.push(outcome);
  setPhase("after");
  showBanner(outcome);
}

function showBanner(o: Outcome) {
  const youScore = state.role === "striker";
  const words: Record<Outcome, string> = {
    goal: youScore ? "GOAL!" : "Goal.",
    save: youScore ? "Saved." : "SAVED!",
    miss: youScore ? "Wide." : "Off target!",
    post: youScore ? "Off the post." : "Off the post!",
  };
  const good = youScore ? o === "goal" : o !== "goal";
  banner.textContent = words[o];
  banner.className = good ? "banner good" : "banner bad";
  banner.hidden = false;
  setHud();
  const done = state.results.length;
  const count = state.role === "striker" ? state.results.filter((r) => r === "goal").length : state.results.filter((r) => r !== "goal").length;
  live.textContent = `${words[o]} ${count} of ${done} ${state.role === "striker" ? "scored" : "kept out"}.`;
  hint.textContent = "";
  window.setTimeout(() => {
    if (state.phase !== "after") return;
    if (done >= KICKS) endMatch();
    else {
      state.round++;
      nextKick();
    }
  }, 1700);
}

function endMatch() {
  state.phase = "idle";
  const striker = state.role === "striker";
  const n = striker ? state.results.filter((r) => r === "goal").length : state.results.filter((r) => r !== "goal").length;
  const lines = striker
    ? ["Back to the training ground.", "The keeper had your number.", "Two goals. Keep practising.", "Three goals. A solid shift.", "Four from five. Ice cold.", "Five from five. Clinical."]
    : ["They found the corners every time.", "One stop. Shake it off.", "Two stops. Not bad.", "Three stops. A proper keeper.", "Four stops. A wall.", "Clean sheet. Unbeatable."];
  $("#end-score").textContent = `${n} / ${KICKS}`;
  $("#end-label").textContent = striker ? "penalties scored" : "penalties kept out";
  $("#end-line").textContent = lines[n];
  $("#end-who").textContent = `${state.you.name} vs ${state.opp.name}`;
  show("end");
}

$("#again").addEventListener("click", () => {
  shuffleAfter();
  startMatch();
});
$("#switch").addEventListener("click", () => {
  state.role = state.role === "striker" ? "keeper" : "striker";
  shuffleAfter();
  startMatch();
});
$("#change").addEventListener("click", openSelect);

function shuffleAfter() {
  const pool = roster.filter((r) => r.id !== state.you.id && r.id !== state.opp.id);
  state.opp = pool[Math.floor(Math.random() * pool.length)];
}

/* ──────────────────────────── Input ──────────────────────────── */

function toLogical(e: PointerEvent) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left - offsetX) / scale, y: (e.clientY - r.top) / scale };
}

function clampAim(p: { x: number; y: number }) {
  return { x: clamp(p.x, -GOAL_HALF - 0.6, GOAL_HALF + 0.6), y: clamp(p.y, 0.15, GOAL_H + 0.6) };
}

canvas.addEventListener("pointermove", (e) => {
  if (state.phase !== "aim") return;
  const l = toLogical(e);
  state.aim = clampAim(toGoalPlane(view, l.x, l.y));
});

canvas.addEventListener("pointerdown", (e) => {
  const l = toLogical(e);
  const g = toGoalPlane(view, l.x, l.y);
  if (state.role === "striker") {
    if (state.phase === "aim") {
      // On touch screens the first tap both aims and locks.
      state.aim = clampAim(g);
      lockAim();
    } else if (state.phase === "power") shoot();
  } else playerDive(g.x, g.y);
});

const keyDive: Record<string, [number, number]> = {
  ArrowLeft: [-2.7, 0.6],
  ArrowRight: [2.7, 0.6],
  ArrowDown: [0, 0.5],
  ArrowUp: [0, 1.9],
  q: [-2.7, 1.9],
  e: [2.7, 1.9],
};

window.addEventListener("keydown", (e) => {
  if ($("#hud").hidden) return;
  if (state.role === "striker") {
    if (state.phase === "aim") {
      const step = 0.25;
      if (e.key === "ArrowLeft") state.aim.x -= step;
      else if (e.key === "ArrowRight") state.aim.x += step;
      else if (e.key === "ArrowUp") state.aim.y += step;
      else if (e.key === "ArrowDown") state.aim.y -= step;
      else if (e.key === " " || e.key === "Enter") lockAim();
      else return;
      state.aim = clampAim(state.aim);
      e.preventDefault();
    } else if (state.phase === "power" && (e.key === " " || e.key === "Enter")) {
      shoot();
      e.preventDefault();
    }
  } else {
    const d = keyDive[e.key] ?? keyDive[e.key.toLowerCase()];
    if (d) {
      playerDive(d[0], d[1]);
      e.preventDefault();
    }
  }
});

/* ───────────────────────────── Loop ──────────────────────────── */

let last = now();
function frame() {
  const t = now();
  const dt = Math.min(0.05, t - last);
  last = t;
  update(t, dt);
  draw(t);
  requestAnimationFrame(frame);
}

function update(t: number, dt: number) {
  const el = t - state.phaseStart;
  state.flash = Math.max(0, state.flash - dt * 0.6);
  if (state.ripple) state.ripple.k = Math.max(0, state.ripple.k - dt * 1.2);

  if (state.phase === "power") {
    const speed = 1.15 + state.round * 0.08;
    const c = (el * speed) % 2;
    state.power = c < 1 ? c : 2 - c;
    powerMarker.style.left = `${state.power * 100}%`;
  }

  if (state.phase === "runup" && el > 1.25) aiShot();

  if (state.phase === "flight") {
    const s = state.shot;
    const u = clamp((t - s.start) / s.dur, 0, 1);
    state.ball.x = s.tx * u + Math.sin(Math.PI * u) * s.curve;
    state.ball.y = s.ty * u + Math.sin(Math.PI * u) * s.arc;
    state.ball.z = SPOT_Z + (KEEPER_Z - SPOT_Z) * u;
    state.ball.spin += dt * 14;
    if (u >= 1) resolve(t);
  } else if (state.phase === "after" && state.after) {
    const a = state.after;
    const u = clamp((t - a.start) / a.dur, 0, 1);
    const e = easeOut(u);
    state.ball.x = a.from.x + (a.to.x - a.from.x) * e;
    state.ball.z = a.from.z + (a.to.z - a.from.z) * e;
    const base = a.from.y + (a.to.y - a.from.y) * e;
    state.ball.y = Math.max(0, base + Math.sin(Math.PI * u) * a.bounce);
    state.ball.spin += dt * 8 * (1 - u);
  }
}

function draw(t: number) {
  const v = view;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#0b1f42";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  drawBackdrop(ctx, v, t, reduceMotion ? 0 : state.flash);
  drawGoal(ctx, v, state.ripple, true);

  // Ball behind the keeper once it reaches the goal line
  const keeper = keeperPlayer();
  const k = keeperAt(t);
  const kp = project(v, k.x, k.y, KEEPER_Z);
  const size = KEEPER_H * kp.s;
  const ballBehind = state.ball.z > KEEPER_Z;
  if (ballBehind) drawBall(ctx, v, state.ball.x, state.ball.y, state.ball.z, state.ball.spin);
  // The draw function rotates around a point 45% up the body: place that point on the body centre.
  drawPlayer(ctx, keeper, faces.get(keeper.id), kp.x, kp.y + size * 0.45, size, keeperPose(k), true);
  drawGoal(ctx, v, null, false);
  if (!ballBehind) drawBall(ctx, v, state.ball.x, state.ball.y, state.ball.z, state.ball.spin);

  if (state.role === "striker" && (state.phase === "aim" || state.phase === "power")) {
    drawReticle(ctx, v, state.aim.x, state.aim.y, t, state.phase === "power");
  }
  if (state.role === "keeper" && state.earlyGuess && state.phase === "runup") {
    drawReticle(ctx, v, state.earlyGuess.x, state.earlyGuess.y, t, true);
  }
  // Run-up: the striker's three steps toward the ball
  if (state.role === "keeper" && state.phase === "runup") {
    const steps = Math.min(3, Math.floor((t - state.phaseStart) / 0.4) + 1);
    const p = project(v, 0, 0, SPOT_Z);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "700 18px 'Public Sans Variable', 'Public Sans', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${strikerPlayer().shirtName} steps up${".".repeat(steps)}`, p.x, p.y + 52);
  }
}

/* ───────────────────────────── Start ─────────────────────────── */

show("title");
requestAnimationFrame(frame);
