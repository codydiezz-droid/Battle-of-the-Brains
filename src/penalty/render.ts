import type { Kit, Player } from "./players";

/*
 * Everything is drawn on one 2D canvas in a simple perspective: the camera
 * stands behind the penalty spot looking at the goal. World units are metres.
 *   X: left/right from the centre of the goal
 *   Y: height above the grass
 *   Z: distance from the camera
 */
export const SPOT_Z = 6;
export const GOAL_Z = 17; // 11 m from the spot, like the real thing
export const GOAL_HALF = 3.66;
export const GOAL_H = 2.44;
export const BALL_R = 0.11;
const CAM_H = 1.05;
const F = 1500;

export interface View {
  /** Logical width: 1000 on wide screens, narrower on phones so the goal fills more of the screen. */
  w: number;
  h: number;
  horizon: number;
  cx: number;
}

export function makeView(w: number, h: number): View {
  return { w, h, horizon: Math.round(h * (h > w ? 0.48 : 0.35)), cx: w / 2 };
}

export function project(v: View, x: number, y: number, z: number) {
  const s = F / z;
  return { x: v.cx + x * s, y: v.horizon + (CAM_H - y) * s, s };
}

/** Screen point to a point on the goal plane (the inverse of project at GOAL_Z). */
export function toGoalPlane(v: View, sx: number, sy: number) {
  const s = F / GOAL_Z;
  return { x: (sx - v.cx) / s, y: CAM_H - (sy - v.horizon) / s };
}

/* ───────────────────────────── Backdrop ───────────────────────────── */

let crowdSeed: { x: number; y: number; c: string; r: number }[] | null = null;
let crowdW = 0;

function crowd(v: View) {
  if (crowdSeed && crowdW === v.w) return crowdSeed;
  crowdW = v.w;
  const colors = ["#2b3d63", "#3a4f7a", "#1f2d4d", "#ffb81c", "#f68835", "#dfe7f5", "#3d8bff", "#56688f"];
  const out: { x: number; y: number; c: string; r: number }[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900; i++) {
    out.push({ x: rnd() * v.w, y: rnd(), c: colors[Math.floor(rnd() * colors.length)], r: 2 + rnd() * 2.6 });
  }
  crowdSeed = out;
  return out;
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, v: View, t: number, flash: number) {
  const top = v.horizon - 150;
  // Night sky
  const sky = ctx.createLinearGradient(0, 0, 0, top + 40);
  sky.addColorStop(0, "#050f24");
  sky.addColorStop(1, "#0d2550");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, v.w, top + 40);

  // Floodlight glow
  for (const lx of [90, v.w - 90]) {
    const g = ctx.createRadialGradient(lx, top - 60, 0, lx, top - 60, 260);
    g.addColorStop(0, "rgba(255,244,214,0.55)");
    g.addColorStop(1, "rgba(255,244,214,0)");
    ctx.fillStyle = g;
    ctx.fillRect(lx - 260, top - 320, 520, 520);
    ctx.fillStyle = "#fff8e6";
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.fillRect(lx - 24 + i * 18, top - 74 + j * 12, 12, 8);
  }

  // Stand and crowd, which bounces after a goal
  const standTop = top;
  const standBottom = v.horizon - 6;
  const stand = ctx.createLinearGradient(0, standTop, 0, standBottom);
  stand.addColorStop(0, "#0a1830");
  stand.addColorStop(1, "#13284a");
  ctx.fillStyle = stand;
  ctx.fillRect(0, standTop, v.w, standBottom - standTop);
  for (const p of crowd(v)) {
    const y = standTop + 8 + p.y * (standBottom - standTop - 26);
    const bob = flash > 0 ? Math.sin(t * 22 + p.x) * 4 * flash : Math.sin(t * 2 + p.x) * 0.6;
    ctx.fillStyle = p.c;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(p.x, y + bob, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Advertising boards
  const boardY = v.horizon - 22;
  ctx.fillStyle = "#091d3f";
  ctx.fillRect(0, boardY, v.w, 22);
  ctx.font = "800 13px 'Schibsted Grotesk Variable', 'Schibsted Grotesk', Arial, sans-serif";
  ctx.textBaseline = "middle";
  const words = ["ONEBRIDGE", "SOUTHWESTERN UNIVERSITY", "HSI BATTLE OF THE BRAINS 2026", "GO PIRATES"];
  let x = ((-t * 40) % 360) - 360;
  let i = 0;
  while (x < v.w) {
    ctx.fillStyle = i % 2 ? "#ffb81c" : "#8fb8ff";
    const word = words[i % words.length];
    ctx.fillText(word, x, boardY + 11);
    x += ctx.measureText(word).width + 48;
    i++;
  }

  // Pitch with mowing stripes in perspective
  ctx.fillStyle = "#2f8f3f";
  ctx.fillRect(0, v.horizon, v.w, v.h - v.horizon);
  for (let z = GOAL_Z + 14; z > 2; z -= 2) {
    const a = project(v, 0, 0, z).y;
    const b = project(v, 0, 0, Math.max(1.2, z - 2)).y;
    if (Math.round(z / 2) % 2) {
      ctx.fillStyle = "#349a45";
      ctx.fillRect(0, a, v.w, b - a);
    }
  }

  // Lines: goal line, six-yard box, penalty box, spot
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  const line = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([px, pz], k) => {
      const p = project(v, px, 0, pz);
      if (k === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  };
  line([[-40, GOAL_Z], [40, GOAL_Z]]);
  line([[-9.16, GOAL_Z], [-9.16, GOAL_Z - 5.5], [9.16, GOAL_Z - 5.5], [9.16, GOAL_Z]]);
  line([[-20.16, GOAL_Z], [-20.16, GOAL_Z - 16.5], [20.16, GOAL_Z - 16.5], [20.16, GOAL_Z]]);
  const spot = project(v, 0, 0, SPOT_Z);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.ellipse(spot.x, spot.y + 2, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ─────────────────────────────── Goal ─────────────────────────────── */

/** ripple: where the ball hit the net (goal-plane metres) and how strongly. */
export function drawGoal(ctx: CanvasRenderingContext2D, v: View, ripple: { x: number; y: number; k: number } | null, back: boolean) {
  const depth = 2;
  const p = (x: number, y: number, z: number) => project(v, x, y, z);
  if (back) {
    // Net: back panel and sides, drawn behind the keeper
    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.lineWidth = 1;
    const bz = GOAL_Z + depth;
    const bulge = (x: number, y: number) => {
      if (!ripple || ripple.k <= 0) return 0;
      const d = Math.hypot(x - ripple.x, y - ripple.y);
      return Math.max(0, 1 - d / 1.6) * 0.9 * ripple.k;
    };
    for (let x = -GOAL_HALF; x <= GOAL_HALF + 0.01; x += 0.3) {
      ctx.beginPath();
      for (let y = 0; y <= GOAL_H + 0.01; y += 0.3) {
        const q = p(x, y, bz + bulge(x, y));
        if (y === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
    }
    for (let y = 0; y <= GOAL_H + 0.01; y += 0.3) {
      ctx.beginPath();
      for (let x = -GOAL_HALF; x <= GOAL_HALF + 0.01; x += 0.3) {
        const q = p(x, y, bz + bulge(x, y));
        if (x === -GOAL_HALF) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
    }
    // Side and roof nets
    for (const sx of [-GOAL_HALF, GOAL_HALF]) {
      for (let y = 0; y <= GOAL_H + 0.01; y += 0.4) {
        const a = p(sx, y, GOAL_Z);
        const b = p(sx, y, bz);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    for (let x = -GOAL_HALF; x <= GOAL_HALF + 0.01; x += 0.6) {
      const a = p(x, GOAL_H, GOAL_Z);
      const b = p(x, GOAL_H, bz);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    return;
  }
  // Frame, drawn in front of the net
  const l = p(-GOAL_HALF, 0, GOAL_Z);
  const r = p(GOAL_HALF, 0, GOAL_Z);
  const tl = p(-GOAL_HALF, GOAL_H, GOAL_Z);
  const tr = p(GOAL_HALF, GOAL_H, GOAL_Z);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(l.x, l.y);
  ctx.lineTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(r.x, r.y);
  ctx.stroke();
}

/* ─────────────────────────────── Ball ─────────────────────────────── */

export function drawBall(ctx: CanvasRenderingContext2D, v: View, x: number, y: number, z: number, spin: number) {
  // Shadow on the grass
  const g = project(v, x, 0, z);
  const shadowR = BALL_R * 1.1 * g.s + 2;
  ctx.fillStyle = `rgba(0,0,0,${Math.max(0.08, 0.35 - y * 0.08)})`;
  ctx.beginPath();
  ctx.ellipse(g.x, g.y, shadowR, shadowR * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // A touch larger than life far away, so it stays readable in the goalmouth.
  const p = project(v, x, y + BALL_R, z);
  const r = BALL_R * p.s + 2;
  const body = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(1, "#c9d2df");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#091d3f";
  for (let i = 0; i < 5; i++) {
    const a = spin + (i * Math.PI * 2) / 5;
    const px = p.x + Math.cos(a) * r * 0.62;
    const py = p.y + Math.sin(a) * r * 0.62;
    pentagon(ctx, px, py, r * 0.26, a);
  }
  pentagon(ctx, p.x, p.y, r * 0.3, spin);
  ctx.restore();
  ctx.strokeStyle = "rgba(9,29,63,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function pentagon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const t = a + (i * Math.PI * 2) / 5;
    const px = x + Math.cos(t) * r;
    const py = y + Math.sin(t) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/* ────────────────────────────── Players ───────────────────────────── */

export interface Pose {
  /** Rotation of the whole body around its centre, radians (positive = toward the right). */
  angle: number;
  /** 0 = arms down, 1 = arms fully up. */
  arms: number;
  /** -1 left, 0 none, 1 right: which side the arms reach toward. */
  reach: number;
}

const idlePose: Pose = { angle: 0, arms: 0.25, reach: 0 };

/**
 * A footballer with a big head, front view. (x, y) is the point between the
 * feet; size is the full height in pixels. The face is the person's portrait.
 */
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  face: HTMLImageElement | undefined,
  x: number,
  y: number,
  size: number,
  pose: Pose = idlePose,
  keeper = false,
) {
  const u = size; // one unit = full height
  const k = player.kit;
  ctx.save();
  // Rotate around the middle of the body
  const pivotY = y - u * 0.45;
  ctx.translate(x, pivotY);
  ctx.rotate(pose.angle);
  ctx.translate(0, u * 0.45);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 0, u * 0.2, u * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs and socks
  for (const side of [-1, 1]) {
    const lx = side * u * 0.075;
    ctx.fillStyle = k.socks;
    roundRect(ctx, lx - u * 0.042, -u * 0.24, u * 0.084, u * 0.2, u * 0.03);
    ctx.fill();
    ctx.fillStyle = "#11141a";
    roundRect(ctx, lx - u * 0.05, -u * 0.05, u * 0.1, u * 0.05, u * 0.02);
    ctx.fill();
  }
  // Shorts
  ctx.fillStyle = k.shorts;
  roundRect(ctx, -u * 0.15, -u * 0.36, u * 0.3, u * 0.14, u * 0.03);
  ctx.fill();
  ctx.strokeStyle = shade(k.shorts, -0.18);
  ctx.lineWidth = Math.max(1, u * 0.006);
  ctx.stroke();

  // Arms (behind the torso when down)
  const shoulderY = -u * 0.6;
  const armLen = u * 0.26;
  for (const side of [-1, 1]) {
    const lift = pose.arms * (pose.reach === 0 || pose.reach === side ? 1 : 0.55);
    const ang = side * (0.35 + lift * 2.35); // from hanging down to straight up and out
    const sx = side * u * 0.19;
    const ex = sx + Math.sin(ang) * armLen;
    const ey = shoulderY + Math.cos(ang) * armLen;
    ctx.strokeStyle = k.shirt === "#ffffff" ? "#e9edf3" : k.shirt;
    ctx.lineWidth = u * 0.08;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx, shoulderY + u * 0.02);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // Gloves for the keeper, hands otherwise
    ctx.fillStyle = keeper ? "#d7ff3f" : "#c99a73";
    ctx.beginPath();
    ctx.arc(ex, ey, u * (keeper ? 0.055 : 0.038), 0, Math.PI * 2);
    ctx.fill();
    if (keeper) {
      ctx.strokeStyle = "#1b2a5c";
      ctx.lineWidth = Math.max(1, u * 0.008);
      ctx.stroke();
    }
  }

  // Torso / shirt
  drawShirt(ctx, k, u, player.number);

  // Head: the portrait, cropped to a circle
  const hr = u * 0.17;
  const hy = -u * 0.6 - hr * 0.92;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, hy, hr + u * 0.012, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, hy, hr, 0, Math.PI * 2);
  ctx.clip();
  if (face && face.complete && face.naturalWidth) {
    const c = player.faceCrop;
    const side = Math.min(face.naturalWidth, face.naturalHeight) * c.size;
    const sx = face.naturalWidth * c.cx - side / 2;
    const sy = face.naturalHeight * c.cy - side / 2;
    ctx.drawImage(face, sx, sy, side, side, -hr, hy - hr, hr * 2, hr * 2);
  } else {
    ctx.fillStyle = "#c9b79c";
    ctx.fillRect(-hr, hy - hr, hr * 2, hr * 2);
  }
  ctx.restore();
  ctx.restore();
}

function drawShirt(ctx: CanvasRenderingContext2D, k: Kit, u: number, number: number) {
  const top = -u * 0.64;
  const bottom = -u * 0.34;
  const w = u * 0.42;
  ctx.save();
  ctx.beginPath();
  // A shirt silhouette with short sleeves
  ctx.moveTo(-w / 2, bottom);
  ctx.lineTo(-w / 2, top + u * 0.08);
  ctx.lineTo(-w / 2 - u * 0.06, top + u * 0.11);
  ctx.lineTo(-w / 2 - u * 0.03, top + u * 0.02);
  ctx.quadraticCurveTo(-w / 2 + u * 0.02, top - u * 0.01, -u * 0.06, top);
  ctx.lineTo(u * 0.06, top);
  ctx.quadraticCurveTo(w / 2 - u * 0.02, top - u * 0.01, w / 2 + u * 0.03, top + u * 0.02);
  ctx.lineTo(w / 2 + u * 0.06, top + u * 0.11);
  ctx.lineTo(w / 2, top + u * 0.08);
  ctx.lineTo(w / 2, bottom);
  ctx.closePath();
  ctx.fillStyle = k.shirt;
  ctx.fill();
  ctx.clip();

  ctx.fillStyle = k.trim;
  switch (k.pattern) {
    case "sash":
      ctx.beginPath();
      ctx.moveTo(-w / 2, top + u * 0.02);
      ctx.lineTo(-w / 2 + u * 0.08, top);
      ctx.lineTo(w / 2, bottom - u * 0.02);
      ctx.lineTo(w / 2 - u * 0.08, bottom + u * 0.02);
      ctx.closePath();
      ctx.globalAlpha = 0.9;
      ctx.fill();
      break;
    case "band":
      ctx.fillRect(-w, top + u * 0.11, w * 2, u * 0.035);
      ctx.fillStyle = shade(k.trim, 0.5);
      ctx.fillRect(-w, top + u * 0.145, w * 2, u * 0.012);
      break;
    case "sleeves":
      // White sleeves and shoulders
      ctx.fillRect(-w, top, w / 2 + u * 0.03, u * 0.13);
      ctx.fillRect(w / 2 - u * 0.03, top, w, u * 0.13);
      break;
    case "side":
      ctx.fillRect(-w / 2, top, u * 0.03, u * 0.4);
      ctx.fillRect(w / 2 - u * 0.03, top, u * 0.03, u * 0.4);
      break;
    case "pirate":
      // Gold pinstripes and a small skull and crossbones
      ctx.globalAlpha = 0.35;
      for (let x = -w; x < w; x += u * 0.045) ctx.fillRect(x, top, u * 0.006, u * 0.4);
      ctx.globalAlpha = 1;
      skull(ctx, 0, top + u * 0.12, u * 0.055);
      break;
    default:
      break;
  }
  ctx.globalAlpha = 1;
  // Collar
  ctx.strokeStyle = k.trim;
  ctx.lineWidth = u * 0.016;
  ctx.beginPath();
  ctx.moveTo(-u * 0.06, top + u * 0.002);
  ctx.lineTo(0, top + u * 0.045);
  ctx.lineTo(u * 0.06, top + u * 0.002);
  ctx.stroke();
  ctx.restore();

  // Number on the chest (not for the pirate crest, which takes the middle)
  if (k.pattern !== "pirate") {
    ctx.fillStyle = k.number;
    ctx.font = `800 ${Math.round(u * 0.09)}px 'Schibsted Grotesk Variable', 'Schibsted Grotesk', Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number), u * 0.09, top + u * 0.17);
  }
}

function skull(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.strokeStyle = "#ffb81c";
  ctx.lineWidth = r * 0.32;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - r * 1.3, y + r * 0.3);
  ctx.lineTo(x + r * 1.3, y + r * 1.6);
  ctx.moveTo(x + r * 1.3, y + r * 0.3);
  ctx.lineTo(x - r * 1.3, y + r * 1.6);
  ctx.stroke();
  ctx.fillStyle = "#f4ead2";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - r * 0.55, y + r * 0.5, r * 1.1, r * 0.6);
  ctx.fillStyle = "#141210";
  ctx.beginPath();
  ctx.arc(x - r * 0.38, y, r * 0.26, 0, Math.PI * 2);
  ctx.arc(x + r * 0.38, y, r * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)),
  );
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}

/* ─────────────────────────────── Aim ──────────────────────────────── */

export function drawReticle(ctx: CanvasRenderingContext2D, v: View, x: number, y: number, t: number, locked: boolean) {
  const p = project(v, x, y, GOAL_Z);
  const r = 16 + (locked ? 0 : Math.sin(t * 6) * 2);
  ctx.save();
  ctx.strokeStyle = locked ? "#ffb81c" : "#ffffff";
  ctx.lineWidth = 3;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    ctx.moveTo(p.x + dx * (r - 6), p.y + dy * (r - 6));
    ctx.lineTo(p.x + dx * (r + 7), p.y + dy * (r + 7));
  }
  ctx.stroke();
  ctx.restore();
}
