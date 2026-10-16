/**
 * The hero's "bridge": a stream of light flowing along an arc that mirrors the
 * OneBridge logo, gold on the left and copper on the right, with a field of
 * faint points behind it. Drawn with the 2D canvas (no 3D library to
 * download), using a simple perspective projection and pre-rendered glow
 * sprites. Loaded on demand from HeroBridge, never on the critical path.
 */

type V3 = { x: number; y: number; z: number };

// Arc endpoints and control points (a cubic Bezier, like the logo's span).
const P0: V3 = { x: -7.2, y: -2.1, z: 0 };
const P1: V3 = { x: -3.2, y: 3.6, z: 0.4 };
const P2: V3 = { x: 3.2, y: 3.6, z: -0.4 };
const P3: V3 = { x: 7.2, y: -2.1, z: 0 };
const GOLD = [255, 184, 28];
const COPPER = [255, 122, 61];
// Where the two halves meet: a pale light instead of a muddy mix.
const MID = [255, 242, 212];
const PALE = [216, 199, 163];

function bezier(t: number, out: V3) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  out.x = a * P0.x + b * P1.x + c * P2.x + d * P3.x;
  out.y = a * P0.y + b * P1.y + c * P2.y + d * P3.y;
  out.z = a * P0.z + b * P1.z + c * P2.z + d * P3.z;
  return out;
}

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** A soft round glow in one colour, drawn once and stamped many times. */
function sprite(rgb: number[]) {
  const s = 32;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.35, `rgba(${rgb},0.45)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

export interface BridgeSceneHandle {
  start: () => void;
  stop: () => void;
  setPointer: (x: number, y: number) => void;
  setScroll: (progress: number) => void;
  dispose: () => void;
}

export function createBridgeScene(canvas: HTMLCanvasElement, options: { still: boolean; compact: boolean }): BridgeSceneHandle {
  const ctx = canvas.getContext("2d")!;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

  // Colour ramp along the span: 24 sprites from gold through pale to copper
  const RAMP = 24;
  const ramp = Array.from({ length: RAMP }, (_, i) => {
    const t = i / (RAMP - 1);
    return sprite(t < 0.5 ? mix(GOLD, MID, t * 2) : mix(MID, COPPER, (t - 0.5) * 2));
  });
  const goldSprite = sprite(GOLD);
  const copperSprite = sprite(COPPER);
  const dustSprite = sprite(PALE);

  // 1. The flowing span
  const flowCount = options.compact ? 700 : 1500;
  const flow = Array.from({ length: flowCount }, () => {
    const r = Math.pow(Math.random(), 3) * 0.6;
    const a = Math.random() * Math.PI * 2;
    return {
      seed: Math.random(),
      speed: 0.025 + Math.random() * 0.045,
      ox: (Math.random() - 0.5) * 0.25,
      oy: Math.cos(a) * r,
      oz: Math.sin(a) * r * 1.6,
      size: 0.6 + Math.random() * 1.6,
      alpha: 0.5 + Math.random() * 0.5,
    };
  });
  // 2. Two glowing anchors where the span meets the ground
  const anchorCount = options.compact ? 120 : 260;
  const anchors = Array.from({ length: anchorCount }, (_, i) => {
    const left = i % 2 === 0;
    const base = left ? P0 : P3;
    const r = Math.pow(Math.random(), 1.8) * 1.1;
    const a = Math.random() * Math.PI * 2;
    return {
      p: { x: base.x + Math.cos(a) * r, y: base.y + (Math.random() - 0.6) * 0.5, z: base.z + Math.sin(a) * r },
      img: left ? goldSprite : copperSprite,
      size: 0.8 + Math.random() * 2.2,
      alpha: 0.25 + Math.random() * 0.5,
    };
  });
  // 3. A quiet field of points for depth
  const dustCount = options.compact ? 180 : 360;
  const dust = Array.from({ length: dustCount }, () => ({
    p: { x: (Math.random() - 0.5) * 34, y: (Math.random() - 0.5) * 18, z: -4 - Math.random() * 16 },
    size: 0.6 + Math.random() * 1.4,
    alpha: 0.08 + Math.random() * 0.22,
  }));

  let w = 1;
  let h = 1;
  let wide = true;
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * pixelRatio);
    canvas.height = Math.round(h * pixelRatio);
    // Wide screens: the span sits to the right of the headline.
    // Tall screens: a smaller span floats in the space above the text.
    wide = w / h > 1.15;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const target = { x: 0, y: 0 };
  const cam = { x: 0, y: 0.4, z: 17 };
  let scroll = 0;
  const point: V3 = { x: 0, y: 0, z: 0 };
  // Vertical field of view of 38 degrees, as the old 3D camera had
  const focal = () => (h * pixelRatio) / 2 / Math.tan((38 * Math.PI) / 360);

  /** Project a point (in the span's own space, scaled and shifted) and stamp a sprite. */
  const stamp = (img: HTMLCanvasElement, x: number, y: number, z: number, size: number, alpha: number, lookY: number, f: number) => {
    const dz = cam.z - z;
    if (dz <= 0.1) return;
    const sx = (canvas.width / 2) + ((x - cam.x) * f) / dz;
    const sy = (canvas.height / 2) - ((y - lookY) * f) / dz;
    const r = (size * pixelRatio * 64) / dz;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, sx - r, sy - r, r * 2, r * 2);
  };

  function update(time: number) {
    if (!w || !h) return;
    // Gentle parallax from the pointer, and a slow tilt as the page scrolls
    cam.x += (target.x * 1.4 - cam.x) * 0.04;
    cam.y += (0.4 + target.y * 0.8 - scroll * 2 - cam.y) * 0.04;
    cam.z = 17 + scroll * 4;
    const lookY = cam.y + (0.4 - scroll * 1.5 - cam.y) * 0.5;
    const f = focal();
    const s = wide ? 0.64 : 0.28;
    const offX = wide ? 4.4 : 0;
    const offY = wide ? -0.9 : 4.9;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";

    // Dust drifts slowly round
    const rot = time * 0.01;
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    for (const d of dust) {
      const x = d.p.x * cr + d.p.z * sr;
      const z = -d.p.x * sr + d.p.z * cr;
      stamp(dustSprite, x, d.p.y, z, d.size, d.alpha, lookY, f);
    }
    for (const a of anchors) stamp(a.img, a.p.x * s + offX, a.p.y * s + offY, a.p.z * s, a.size * s * 1.6, a.alpha, lookY, f);
    for (const p of flow) {
      const t = (p.seed + time * p.speed) % 1;
      bezier(t, point);
      // Narrow the stream near the anchors, widen it at mid-span
      const swell = 0.35 + Math.sin(t * Math.PI) * 0.65;
      const x = (point.x + p.ox) * s + offX;
      const y = (point.y + p.oy * swell) * s + offY;
      const z = (point.z + p.oz * swell) * s;
      stamp(ramp[Math.min(RAMP - 1, Math.floor(t * RAMP))], x, y, z, p.size * s * 1.6, p.alpha, lookY, f);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  let frame = 0;
  let running = false;
  const t0 = performance.now();
  const loop = () => {
    update((performance.now() - t0) / 1000);
    frame = requestAnimationFrame(loop);
  };

  if (options.still) update(4);

  return {
    start() {
      if (running || options.still) return;
      running = true;
      frame = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    },
    setPointer(x, y) {
      target.x = x;
      target.y = y;
    },
    setScroll(p) {
      scroll = p;
      if (options.still) update(4);
    },
    dispose() {
      cancelAnimationFrame(frame);
      ro.disconnect();
    },
  };
}
