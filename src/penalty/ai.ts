import type { Vector3 } from "three";
import { ARM_REACH, type Dive } from "./anim";
import { predictCrossing } from "./physics";
import type { Stats } from "./players";
import { GOAL_H, GOAL_HALF } from "./stadium";

export type Difficulty = "easy" | "medium" | "hard";

/*
 * Difficulty is tuned through reaction time, reading accuracy, reach, shot
 * speed and disguise. Neither AI ever sees where the player is aiming: the
 * keeper only reacts to the ball once it is struck, and the striker only
 * reacts to what the player's keeper has visibly done.
 */
export const DIFF = {
  easy: {
    label: "Easy",
    shootErr: 0.015, // radians of aiming error (before stats)
    overStart: 0.9, // power above this starts to lift and spray
    keeperReact: 0.2,
    keeperNoise: 0.95,
    keeperReach: 0.92,
    keeperDive: 0.56,
    memory: 0,
    aiSpeed: [15.5, 20.5],
    aiFake: 0,
    aiExploit: 0.25,
    aiMiss: 0.1,
    aiMiddle: 0.2,
    aiCorner: 0.35,
    timingHelp: 1,
    sweet: [0.6, 0.84],
  },
  medium: {
    label: "Medium",
    shootErr: 0.024,
    overStart: 0.86,
    keeperReact: 0.12,
    keeperNoise: 0.5,
    keeperReach: 1.06,
    keeperDive: 0.48,
    memory: 0.55,
    aiSpeed: [19, 25.5],
    aiFake: 0.2,
    aiExploit: 0.6,
    aiMiss: 0.08,
    aiMiddle: 0.15,
    aiCorner: 0.6,
    timingHelp: 0.55,
    sweet: [0.64, 0.8],
  },
  hard: {
    label: "Hard",
    shootErr: 0.031,
    overStart: 0.82,
    keeperReact: 0.07,
    keeperNoise: 0.32,
    keeperReach: 1.14,
    keeperDive: 0.42,
    memory: 1,
    aiSpeed: [22, 29.5],
    aiFake: 0.35,
    aiExploit: 0.9,
    aiMiss: 0.06,
    aiMiddle: 0.13,
    aiCorner: 0.85,
    timingHelp: 0,
    sweet: [0.67, 0.78],
  },
} as const;

export type DiffConfig = (typeof DIFF)[Difficulty];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const gauss = () => {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/** How far a keeper's body centre can travel in a dive. */
export const keeperMaxLat = (stats: Stats, reachMul: number) => (1.55 + stats.reach * 0.11) * reachMul;
export const keeperDiveTime = (base: number, stats: Stats) => base - stats.reflex * 0.015;

/* ───────────────────────────── AI keeper ───────────────────────────── */

const sideOf = (x: number) => (x < -1.1 ? -1 : x > 1.1 ? 1 : 0);

export class KeeperBrain {
  /** Sides the player has shot to, most recent last. */
  history: number[] = [];
  private kickAt = -1;
  private decided = false;
  /** A side the keeper has decided to gamble on before the kick. */
  gamble = 0;

  constructor(
    private diff: DiffConfig,
    private stats: Stats,
  ) {}

  setDiff(d: DiffConfig, stats: Stats) {
    this.diff = d;
    this.stats = stats;
  }

  /** Before the run-up: lean toward a side the player keeps using. */
  plan(): { lean: number } {
    this.decided = false;
    this.kickAt = -1;
    this.gamble = 0;
    const recent = this.history.slice(-3).filter((s) => s !== 0);
    if (this.diff.memory > 0 && recent.length >= 2) {
      const left = recent.filter((s) => s < 0).length;
      const right = recent.length - left;
      const fav = left >= 2 ? -1 : right >= 2 ? 1 : 0;
      if (fav && Math.random() < this.diff.memory * 0.65) this.gamble = fav;
    }
    return { lean: this.gamble * 0.35 };
  }

  onKick(t: number) {
    this.kickAt = t;
  }

  /**
   * Called every frame after the kick. Returns a dive once the keeper has
   * reacted. It reads the ball's flight (it cannot see the spin), with error.
   */
  update(t: number, ball: { p: Vector3; v: Vector3 }, keeperX: number): Dive | null {
    if (this.decided || this.kickAt < 0) return null;
    const maxLat = keeperMaxLat(this.stats, this.diff.keeperReach);
    const dur = keeperDiveTime(this.diff.keeperDive, this.stats);
    // A gamble goes early, at the moment of the kick
    if (this.gamble) {
      this.decided = true;
      return { start: t, fromX: keeperX, tx: this.gamble * rand(2.2, 3.1), ty: rand(0.5, 1.6), dur, maxLat };
    }
    if (t - this.kickAt < this.diff.keeperReact) return null;
    this.decided = true;
    const pred = predictCrossing(ball.p, ball.v, 0);
    const speed = ball.v.length();
    const n = this.diff.keeperNoise * (0.55 + speed / 45);
    const tx = pred.x + gauss() * n * 0.6;
    const ty = Math.max(0.2, pred.y + gauss() * n * 0.35);
    // Clearly wide or over: watch it go
    if (Math.abs(pred.x) > GOAL_HALF + 0.5 || pred.y > GOAL_H + 0.5) {
      return { start: t, fromX: keeperX, tx: keeperX + Math.sign(pred.x) * 0.4, ty: 1, dur, maxLat };
    }
    void ARM_REACH;
    return { start: t, fromX: keeperX, tx, ty, dur, maxLat };
  }

  remember(shotX: number) {
    this.history.push(sideOf(shotX));
    if (this.history.length > 8) this.history.shift();
  }
}

/* ───────────────────────────── AI striker ───────────────────────────── */

export interface ShotPlan {
  tx: number;
  ty: number;
  speed: number;
  spin: number;
  /** Which way the body opens at the plant: honest or a disguise. */
  cue: number;
}

export class ShooterBrain {
  constructor(
    private diff: DiffConfig,
    private stats: Stats,
  ) {}

  setDiff(d: DiffConfig, stats: Stats) {
    this.diff = d;
    this.stats = stats;
  }

  /** Decide the intended shot before the run-up. */
  plan(): ShotPlan {
    const d = this.diff;
    let tx: number;
    let ty: number;
    if (Math.random() < d.aiMiddle) {
      tx = rand(-0.8, 0.8);
      ty = rand(0.25, 1.9);
    } else {
      const s = Math.random() < 0.5 ? -1 : 1;
      tx = s * rand(1.7 + d.aiCorner * 0.7, 3.3);
      ty = Math.random() < 0.55 ? rand(0.2, 0.85) : rand(1.3, 2.1 + d.aiCorner * 0.1);
    }
    const speed = rand(d.aiSpeed[0], d.aiSpeed[1]) + (this.stats.power - 3) * 0.6;
    const spin = d === DIFF.hard ? rand(-0.5, 0.5) : d === DIFF.medium ? rand(-0.25, 0.25) : 0;
    const honest = Math.sign(tx) || 0;
    const cue = Math.random() < d.aiFake ? -honest || (Math.random() < 0.5 ? -1 : 1) : honest;
    return { tx, ty, speed, spin, cue };
  }

  /**
   * At the moment of the kick the striker can see the keeper. A keeper who
   * dived early, or stepped off their line, gets punished.
   */
  finalise(plan: ShotPlan, keeper: { x: number; divedEarly: boolean; diveDir: number }): ShotPlan {
    const d = this.diff;
    let { tx, ty } = plan;
    if (keeper.divedEarly && Math.random() < d.aiExploit) {
      tx = -(keeper.diveDir || 1) * rand(1.8, 3.2);
      ty = rand(0.3, 1.8);
    } else if (Math.abs(keeper.x) > 0.45 && Math.random() < d.aiExploit * 0.7) {
      tx = -Math.sign(keeper.x) * rand(2.0, 3.3);
    }
    // Execution error, and the odd miss
    const err = 0.012 * (1.25 - this.stats.accuracy * 0.08) * 11;
    tx += gauss() * err;
    ty += gauss() * err * 0.7;
    if (Math.random() < d.aiMiss) {
      if (Math.random() < 0.5) tx = (Math.sign(tx) || 1) * rand(3.8, 4.4);
      else ty = rand(2.6, 3.1);
    }
    return { ...plan, tx, ty: Math.max(0.15, ty) };
  }
}
