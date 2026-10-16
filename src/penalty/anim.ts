import { HIP_Y, restPose, type Pose } from "./avatar";
import { BALL_R } from "./physics";
import { SPOT_Z } from "./stadium";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut2 = (t: number) => 1 - (1 - t) * (1 - t);

/* ───────────────────────────── Keeper ───────────────────────────── */

export const KEEPER_Z = 0.35;

export interface Dive {
  start: number;
  fromX: number;
  /** Where the hands are aimed, on the goal plane. */
  tx: number;
  ty: number;
  /** Seconds to full stretch. */
  dur: number;
  /** Furthest the body centre can travel sideways. */
  maxLat: number;
}

export interface KeeperState {
  x: number;
  /** -1..1 sideways shuffle velocity, for the stepping animation. */
  moving: number;
  dive: Dive | null;
  mood: "set" | "celebrate" | "dejected";
  moodStart: number;
}

export function newKeeper(): KeeperState {
  return { x: 0, moving: 0, dive: null, mood: "set", moodStart: 0 };
}

/** Body centre offset reached by a dive, used by the AI to judge what it can reach. */
export const ARM_REACH = 1.0;

export function keeperPose(k: KeeperState, t: number): Pose {
  const p = restPose();
  p.root.z = KEEPER_Z;
  p.root.yaw = 0; // facing the penalty taker (+z)
  const d = k.dive;

  if (!d || t < d.start) {
    // Set position: knees bent, arms out, bouncing on the toes; side-steps when moving
    const bob = Math.sin(t * 7) * 0.02;
    p.root.x = k.x;
    p.body.lift = -0.12 + bob;
    p.body.pitch = 0.22;
    p.legL.x = -0.35;
    p.legR.x = -0.35;
    p.kneeL = 0.6;
    p.kneeR = 0.6;
    p.legL.z = 0.12;
    p.legR.z = -0.12;
    p.armL.z = 0.75;
    p.armR.z = -0.75;
    p.armL.x = -0.5;
    p.armR.x = -0.5;
    if (Math.abs(k.moving) > 0.05) {
      const step = Math.sin(t * 16) * 0.35 * Math.abs(k.moving);
      p.legL.z = 0.12 + step;
      p.legR.z = -0.12 + step;
    }
    if (k.mood === "celebrate") return celebrateKeeper(p, k, t);
    return p;
  }

  const e = t - d.start;
  const dx = d.tx - d.fromX;
  const dir = Math.sign(dx) || 1;
  const central = Math.abs(dx) < 0.7;
  const high = d.ty > 1.45;
  const u = clamp(e / d.dur, 0, 1);
  const prog = easeOut2(u);

  if (central) {
    // Stay big in the middle: drop for low shots, spring up for high ones
    p.root.x = lerp(d.fromX, d.fromX + dx * 0.6, prog);
    p.body.pitch = high ? -0.05 : 0.35;
    p.body.lift = high ? 0.45 * Math.sin(Math.PI * clamp(e / (d.dur * 1.6), 0, 1)) : -0.35 * prog;
    p.armL.z = high ? 2.9 : 1.1;
    p.armR.z = high ? -2.9 : -1.1;
    p.armL.x = high ? 0 : -0.9;
    p.armR.x = high ? 0 : -0.9;
    p.legL.z = high ? 0.1 : 0.5;
    p.legR.z = high ? -0.1 : -0.5;
    p.kneeL = high ? 0.2 : 0.4;
    p.kneeR = high ? 0.2 : 0.4;
  } else {
    // Full-stretch dive: hips travel sideways, and the body and arms line up
    // with the point the keeper is diving at, so a correct read covers it.
    const ad = Math.abs(dx);
    const lat = clamp(ad - 0.95, 0, d.maxLat);
    const hipY = clamp(d.ty - 0.55, 0.3, 1.35);
    const theta = Math.atan2(ad - lat, Math.max(0.05, d.ty - hipY));
    const fall = clamp((e - d.dur - 0.12) / 0.35, 0, 1);
    const lying = easeInOut(fall);
    p.root.x = d.fromX + dir * lat * prog;
    p.body.lift = lerp(lerp(-0.12, hipY - HIP_Y, prog), 0.3 - HIP_Y, lying);
    p.body.roll = -dir * lerp(theta * prog, 1.5, lying);
    p.body.pitch = 0.08;
    // Arms swing up past the head, hands together beyond it
    const up = lerp(0.75, Math.PI + 0.28, prog);
    p.armL.z = up;
    p.armR.z = -up;
    p.armL.x = -0.1;
    p.armR.x = -0.1;
    p.legL.z = 0.25 * prog;
    p.legR.z = -0.25 * prog;
    p.kneeL = 0.25;
    p.kneeR = 0.45;
    // Getting back up
    const rec = clamp((e - d.dur - 1.15) / 0.6, 0, 1);
    if (rec > 0) {
      const r = easeInOut(rec);
      p.body.roll = lerp(p.body.roll, 0, r);
      p.body.lift = lerp(p.body.lift, -0.1, r);
      p.armL.z = lerp(p.armL.z, 0.3, r);
      p.armR.z = lerp(p.armR.z, -0.3, r);
      p.legL.z = lerp(p.legL.z, 0, r);
      p.legR.z = lerp(p.legR.z, 0, r);
    }
  }
  if (k.mood === "celebrate" && t - k.moodStart > 0.9) return celebrateKeeper(p, k, t);
  if (k.mood === "dejected" && t - k.moodStart > 1.3) {
    const r = clamp((t - k.moodStart - 1.3) / 0.4, 0, 1);
    p.body.pitch = lerp(p.body.pitch, 0.35, r);
    p.head.x = 0.4 * r;
  }
  return p;
}

function celebrateKeeper(p: Pose, k: KeeperState, t: number) {
  const c = t - k.moodStart;
  const r = clamp(c / 0.4, 0, 1);
  const pump = Math.abs(Math.sin(c * 8));
  p.body.roll = lerp(p.body.roll, 0, r);
  p.body.lift = lerp(p.body.lift, 0.05 + pump * 0.15, r);
  p.body.pitch = lerp(p.body.pitch, -0.1, r);
  p.armL.z = lerp(p.armL.z, 2.6 + pump * 0.3, r);
  p.armR.z = lerp(p.armR.z, -2.6 - pump * 0.3, r);
  p.armL.x = 0;
  p.armR.x = 0;
  p.legL.z = 0.1;
  p.legR.z = -0.1;
  p.kneeL = 0.1;
  p.kneeR = 0.1;
  return p;
}

/* ───────────────────────────── Shooter ───────────────────────────── */

/** Seconds from starting the run-up to striking the ball. */
export const RUNUP = 0.78;
const START = { x: -1.15, z: SPOT_Z + 2.7 };
const PLANT = { x: -0.2, z: SPOT_Z + 0.42 };

export interface ShooterState {
  /** When the run-up started (null while waiting). */
  runStart: number | null;
  /** -1..1: which way the hips open at the plant (the body cue). */
  cue: number;
  mood: "wait" | "celebrate" | "dejected";
  moodStart: number;
  /** Celebration direction. */
  celebrateDir: number;
}

export function newShooter(): ShooterState {
  return { runStart: null, cue: 0, mood: "wait", moodStart: 0, celebrateDir: 1 };
}

export function shooterPose(s: ShooterState, t: number): Pose {
  const p = restPose();
  p.root.yaw = Math.PI; // facing the goal (-z)
  if (s.runStart === null) {
    // Waiting behind the ball
    p.root.x = START.x;
    p.root.z = START.z;
    p.root.yaw = Math.PI + 0.35;
    p.body.lift = Math.sin(t * 2.4) * 0.01;
    p.armL.z = 0.15;
    p.armR.z = -0.15;
    p.legL.z = 0.06;
    p.legR.z = -0.06;
    return p;
  }
  const e = t - s.runStart;
  if (e < RUNUP) {
    // Run in on a curve toward the ball
    const u = e / RUNUP;
    const k = easeInOut(Math.min(1, u * 1.05));
    p.root.x = lerp(START.x, PLANT.x, k);
    p.root.z = lerp(START.z, PLANT.z, k);
    p.root.yaw = Math.PI + 0.35 * (1 - k) + s.cue * 0.32 * clamp((u - 0.6) / 0.4, 0, 1);
    const stride = Math.sin(u * Math.PI * 4.5);
    p.legL.x = stride * 0.75;
    p.legR.x = -stride * 0.75;
    p.kneeL = Math.max(0, -stride) * 0.9 + 0.15;
    p.kneeR = Math.max(0, stride) * 0.9 + 0.15;
    p.armL.x = -stride * 0.6;
    p.armR.x = stride * 0.6;
    p.body.pitch = 0.18;
    p.body.lift = Math.abs(Math.sin(u * Math.PI * 4.5)) * 0.05;
    // Wind up the kicking leg for the last stride
    const wind = clamp((u - 0.78) / 0.22, 0, 1);
    if (wind > 0) {
      p.legR.x = lerp(p.legR.x, 0.95, wind);
      p.kneeR = lerp(p.kneeR, 1.5, wind);
      p.legL.x = lerp(p.legL.x, -0.15, wind);
      p.kneeL = lerp(p.kneeL, 0.2, wind);
      p.armL.z = lerp(0.12, 1.1, wind);
      p.armR.z = lerp(-0.12, -0.6, wind);
      p.body.yaw = s.cue * 0.25 * wind;
      p.body.roll = 0.12 * wind;
    }
    return p;
  }
  // Strike and follow-through
  const f = clamp((e - RUNUP) / 0.32, 0, 1);
  p.root.x = PLANT.x;
  p.root.z = PLANT.z - f * 0.25;
  p.root.yaw = Math.PI + s.cue * 0.32;
  p.legR.x = lerp(0.95, -1.35, easeOut2(Math.min(1, f * 2.4)));
  p.kneeR = lerp(1.5, 0.05, Math.min(1, f * 3));
  p.legL.x = -0.15;
  p.kneeL = 0.25;
  p.armL.z = 1.1;
  p.armR.z = -0.6;
  p.body.pitch = lerp(0.18, -0.12, f);
  p.body.yaw = s.cue * 0.25;
  p.body.roll = 0.12;
  if (s.mood === "celebrate") return celebrateShooter(p, s, t);
  if (s.mood === "dejected") return dejectedShooter(p, s, t);
  return p;
}

function celebrateShooter(p: Pose, s: ShooterState, t: number) {
  const c = t - s.moodStart;
  const r = clamp(c / 0.35, 0, 1);
  // Wheel away toward the corner, then jump with both arms up
  const run = clamp(c / 1.4, 0, 1);
  p.root.x = lerp(p.root.x, p.root.x + s.celebrateDir * 5, easeOut2(run));
  p.root.z = lerp(p.root.z, p.root.z - 1.5, easeOut2(run));
  p.root.yaw = lerp(p.root.yaw, Math.PI / 2 * -s.celebrateDir + (run > 0.9 ? Math.PI : 0), r * 0.6);
  const bounce = Math.abs(Math.sin(c * 7));
  p.body.lift = run >= 1 ? bounce * 0.35 : Math.abs(Math.sin(c * 14)) * 0.06;
  p.body.pitch = lerp(p.body.pitch, -0.15, r);
  p.body.yaw = 0;
  p.body.roll = 0;
  const stride = Math.sin(c * 16) * (run < 1 ? 0.8 : 0);
  p.legL.x = stride;
  p.legR.x = -stride;
  p.kneeL = run >= 1 ? 0.3 + bounce * 0.4 : Math.max(0, -stride);
  p.kneeR = run >= 1 ? 0.3 + bounce * 0.4 : Math.max(0, stride);
  p.armL.z = lerp(p.armL.z, 2.7, r);
  p.armR.z = lerp(p.armR.z, -2.7, r);
  p.armL.x = 0;
  p.armR.x = 0;
  return p;
}

function dejectedShooter(p: Pose, s: ShooterState, t: number) {
  const c = t - s.moodStart;
  const r = clamp(c / 0.5, 0, 1);
  // Hands on head
  p.legR.x = lerp(p.legR.x, 0, r);
  p.kneeR = lerp(p.kneeR, 0, r);
  p.legL.x = lerp(p.legL.x, 0, r);
  p.body.pitch = lerp(p.body.pitch, 0.05, r);
  p.body.yaw = 0;
  p.body.roll = 0;
  p.armL.x = lerp(p.armL.x, -2.5, r);
  p.armR.x = lerp(p.armR.x, -2.5, r);
  p.armL.z = lerp(p.armL.z, 0.9, r);
  p.armR.z = lerp(p.armR.z, -0.9, r);
  p.head.x = -0.25 * r;
  return p;
}

/** The ball sits on the spot until it is struck. */
export const BALL_START = { x: 0, y: BALL_R, z: SPOT_Z };
