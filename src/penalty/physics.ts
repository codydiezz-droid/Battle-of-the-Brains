import { Vector3 } from "three";
import { GOAL_H, GOAL_HALF, NET_DEPTH, POST_R, SPOT_Z } from "./stadium";

/*
 * Ball flight with gravity, a little air drag and sidespin (Magnus) curve,
 * stepped at a fixed 240 Hz so it behaves the same at any frame rate.
 */

export const BALL_R = 0.11;
export const GRAVITY = 9.81;
const DRAG = 0.0042; // per metre: a = -DRAG * |v| * v
const MAGNUS = 0.25; // sideways acceleration per unit of spin per m/s
export const STEP = 1 / 240;

export type BallEvent = "post" | "bar" | "save" | "goal" | "net" | "ground" | "out";

export interface Ball {
  p: Vector3;
  v: Vector3;
  /** Sidespin, -1 (curls left) to 1 (curls right) as seen from behind the shot. */
  spin: number;
  /** Visual roll, radians. */
  roll: number;
  /** State flags */
  crossed: boolean;
  /** Where the ball crossed the goal line (z = 0). */
  crossAt: { x: number; y: number } | null;
  goal: boolean;
  saved: boolean;
  touchedFrame: "post" | "bar" | null;
  inNet: boolean;
  active: boolean;
  time: number;
}

export function newBall(): Ball {
  return {
    p: new Vector3(0, BALL_R, SPOT_Z),
    v: new Vector3(),
    spin: 0,
    roll: 0,
    crossed: false,
    crossAt: null,
    goal: false,
    saved: false,
    touchedFrame: null,
    inNet: false,
    active: false,
    time: 0,
  };
}

const tmp = new Vector3();
const side = new Vector3();

function accel(v: Vector3, spin: number, out: Vector3) {
  const speed = v.length();
  out.set(0, -GRAVITY, 0);
  out.addScaledVector(v, -DRAG * speed);
  if (spin !== 0) {
    // Perpendicular to the velocity in the horizontal plane
    side.set(-v.z, 0, v.x);
    const h = Math.hypot(v.x, v.z) || 1;
    side.multiplyScalar(1 / h);
    out.addScaledVector(side, spin * MAGNUS * speed);
  }
  return out;
}

/** Distance from point p to the segment a-b, returning the closest point in `out`. */
function closestOnSegment(p: Vector3, a: Vector3, b: Vector3, out: Vector3) {
  const ab = tmp.copy(b).sub(a);
  const t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq()));
  return out.copy(a).addScaledVector(ab, t);
}

const frameParts = [
  { a: new Vector3(-GOAL_HALF, 0, 0), b: new Vector3(-GOAL_HALF, GOAL_H, 0), kind: "post" as const },
  { a: new Vector3(GOAL_HALF, 0, 0), b: new Vector3(GOAL_HALF, GOAL_H, 0), kind: "post" as const },
  { a: new Vector3(-GOAL_HALF, GOAL_H, 0), b: new Vector3(GOAL_HALF, GOAL_H, 0), kind: "bar" as const },
];

export interface Sphere {
  p: Vector3;
  r: number;
}

/**
 * Advance the ball by one fixed step. keeper: the goalkeeper's save spheres
 * this step. Returns the events that happened.
 */
export function stepBall(b: Ball, keeper: Sphere[], events: BallEvent[]) {
  if (!b.active) return;
  b.time += STEP;
  const a = accel(b.v, b.spin, new Vector3());
  b.v.addScaledVector(a, STEP);
  const prevZ = b.p.z;
  b.p.addScaledVector(b.v, STEP);
  b.roll += (b.v.length() * STEP) / BALL_R;
  if (b.spin) b.spin *= 1 - STEP * 0.15;

  // Goalkeeper: bounce off the first sphere it touches
  if (!b.saved && !b.crossed) {
    for (const s of keeper) {
      const d = b.p.distanceTo(s.p);
      if (d < s.r + BALL_R) {
        const n = b.p.clone().sub(s.p).normalize();
        const vn = b.v.dot(n);
        if (vn < 0) {
          b.v.addScaledVector(n, -(1 + 0.35) * vn);
          b.v.multiplyScalar(0.55);
          b.v.y += 1.2;
          b.p.copy(s.p).addScaledVector(n, s.r + BALL_R + 0.005);
          b.saved = true;
          b.spin = 0;
          events.push("save");
        }
        break;
      }
    }
  }

  // Posts and crossbar
  for (const f of frameParts) {
    const c = closestOnSegment(b.p, f.a, f.b, new Vector3());
    const d = b.p.distanceTo(c);
    if (d < POST_R + BALL_R) {
      const n = b.p.clone().sub(c).normalize();
      const vn = b.v.dot(n);
      if (vn < 0) {
        b.v.addScaledVector(n, -(1 + 0.6) * vn);
        b.v.multiplyScalar(0.8);
        b.p.copy(c).addScaledVector(n, POST_R + BALL_R + 0.002);
        b.touchedFrame = f.kind;
        b.spin = 0;
        events.push(f.kind);
      }
    }
  }

  // Crossing the goal line
  if (!b.crossed && prevZ >= 0 && b.p.z < 0) {
    b.crossed = true;
    const f = prevZ / (prevZ - b.p.z);
    b.crossAt = { x: b.p.x - b.v.x * STEP * (1 - f), y: b.p.y - b.v.y * STEP * (1 - f) };
    if (Math.abs(b.p.x) < GOAL_HALF && b.p.y < GOAL_H) {
      b.goal = true;
      b.inNet = true;
      events.push("goal");
    } else events.push("out");
  }

  // Inside the net: soak up the speed, stay inside the box
  if (b.inNet) {
    const damp = Math.exp(-STEP * 9);
    b.v.multiplyScalar(damp);
    if (b.p.z < -NET_DEPTH + BALL_R) {
      b.p.z = -NET_DEPTH + BALL_R;
      if (b.v.z < 0) {
        b.v.z *= -0.15;
        events.push("net");
      }
    }
    const lim = GOAL_HALF - BALL_R;
    if (Math.abs(b.p.x) > lim) {
      b.p.x = Math.sign(b.p.x) * lim;
      b.v.x *= -0.2;
    }
    if (b.p.y > GOAL_H - BALL_R) {
      b.p.y = GOAL_H - BALL_R;
      b.v.y = Math.min(0, b.v.y);
    }
  }

  // Ground
  if (b.p.y < BALL_R) {
    b.p.y = BALL_R;
    if (b.v.y < -0.6) {
      b.v.y *= -0.52;
      events.push("ground");
    } else b.v.y = 0;
    b.v.x *= 0.985;
    b.v.z *= 0.985;
  }
}

/** The point where a ball would cross the goal line, by simulating forward. */
export function predictCrossing(p: Vector3, v: Vector3, spin: number, maxT = 3) {
  const pp = p.clone();
  const vv = v.clone();
  const a = new Vector3();
  let t = 0;
  while (t < maxT) {
    accel(vv, spin, a);
    vv.addScaledVector(a, STEP);
    pp.addScaledVector(vv, STEP);
    t += STEP;
    if (pp.z <= 0) return { x: pp.x, y: pp.y, t };
    if (pp.y < BALL_R) {
      pp.y = BALL_R;
      vv.y = Math.abs(vv.y) * 0.5;
    }
  }
  return { x: pp.x, y: pp.y, t };
}

/**
 * Initial velocity that sends a ball from `from` to land on (tx, ty) on the
 * goal line at the given speed, with drag and curve included. Solved by a few
 * rounds of shooting and correcting, so the ball goes where it was aimed.
 */
export function solveShot(from: Vector3, tx: number, ty: number, speed: number, spin: number) {
  let ax = tx;
  let ay = ty;
  const v = new Vector3();
  for (let i = 0; i < 6; i++) {
    const dx = ax - from.x;
    const dz = -from.z;
    const dist = Math.hypot(dx, dz);
    const t = dist / speed;
    v.set(dx / t, (ay - from.y + 0.5 * GRAVITY * t * t) / t, dz / t);
    const hit = predictCrossing(from, v, spin);
    ax += tx - hit.x;
    ay += ty - hit.y;
  }
  return v;
}
