import type { Kit, Look, Player } from "./players";

/*
 * Pixel-art textures for the blocky characters, all drawn on small canvases.
 * Heads are 16 x 16 pixels per face; the torso is 32 x 40 on the front and back.
 */

type Ctx = CanvasRenderingContext2D;

export function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

const px = (g: Ctx, x: number, y: number, color: string, w = 1, h = 1) => {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
};

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)),
  );
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}

/* ───────────────────────────── Pixel font ───────────────────────────── */

// 3 x 5 glyphs, one row per string, "1" = filled.
const FONT: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["110", "101", "101", "101", "101"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "110", "011"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "110"],
};

function text(g: Ctx, s: string, cx: number, y: number, color: string, scale = 1) {
  const chars = s.split("");
  const width = chars.length * 4 * scale - scale;
  let x = Math.round(cx - width / 2);
  for (const ch of chars) {
    const glyph = FONT[ch];
    if (glyph) {
      glyph.forEach((row, r) =>
        row.split("").forEach((bit, c) => {
          if (bit === "1") px(g, x + c * scale, y + r * scale, color, scale, scale);
        }),
      );
    }
    x += 4 * scale;
  }
}

/* ─────────────────────────────── Heads ─────────────────────────────── */

/** The face (front of the head), 16 x 16. */
function faceTextureLow(look: Look) {
  const { c, g } = canvas(16, 16);
  const skin = look.skin;
  const hair = look.hair;
  const dark = shade(skin, -0.18);
  px(g, 0, 0, skin, 16, 16);
  // Soft shading at the jaw
  px(g, 0, 15, dark, 16, 1);
  px(g, 0, 14, dark, 1, 2);
  px(g, 15, 14, dark, 1, 2);

  // Hairline / fringe
  switch (look.style) {
    case "bob-bangs":
      px(g, 0, 0, hair, 16, 5);
      px(g, 0, 5, hair, 2, 9);
      px(g, 14, 5, hair, 2, 9);
      px(g, 3, 5, hair, 3, 1);
      px(g, 9, 5, hair, 4, 1);
      break;
    case "chin":
      px(g, 0, 0, hair, 16, 3);
      px(g, 0, 3, hair, 5, 1);
      px(g, 11, 3, hair, 5, 1);
      px(g, 0, 4, hair, 2, 8);
      px(g, 14, 4, hair, 2, 8);
      break;
    case "long":
    case "long-wavy":
      px(g, 0, 0, hair, 16, 3);
      px(g, 0, 3, hair, 6, 1);
      px(g, 10, 3, hair, 6, 1);
      px(g, 0, 4, hair, 2, 12);
      px(g, 14, 4, hair, 2, 12);
      if (look.style === "long-wavy") {
        px(g, 2, 4, hair, 1, 2);
        px(g, 13, 4, hair, 1, 2);
        px(g, 1, 15, shade(hair, 0.15), 1, 1);
        px(g, 14, 15, shade(hair, 0.15), 1, 1);
      }
      break;
    case "curly-short":
      px(g, 0, 0, hair, 16, 3);
      for (let x = 0; x < 16; x += 2) px(g, x, 3, hair, 1, 1);
      px(g, 0, 3, hair, 1, 3);
      px(g, 15, 3, hair, 1, 3);
      break;
    case "short-up":
      px(g, 0, 0, hair, 16, 3);
      px(g, 2, 3, hair, 12, 1);
      px(g, 0, 3, hair, 1, 3);
      px(g, 15, 3, hair, 1, 3);
      break;
    case "short-messy":
      px(g, 0, 0, hair, 16, 3);
      px(g, 1, 3, hair, 3, 1);
      px(g, 6, 3, hair, 2, 1);
      px(g, 11, 3, hair, 4, 1);
      px(g, 0, 3, hair, 1, 3);
      px(g, 15, 3, hair, 1, 3);
      break;
    case "short-side":
      px(g, 0, 0, hair, 16, 3);
      px(g, 0, 3, hair, 10, 1);
      px(g, 0, 3, hair, 1, 3);
      px(g, 15, 3, hair, 1, 3);
      if (look.temples) {
        px(g, 0, 4, look.temples, 1, 2);
        px(g, 15, 4, look.temples, 1, 2);
      }
      break;
    case "braids-up":
      px(g, 0, 0, hair, 16, 3);
      for (let x = 1; x < 16; x += 3) px(g, x, 0, shade(hair, 0.18), 1, 3);
      px(g, 0, 3, hair, 1, 2);
      px(g, 15, 3, hair, 1, 2);
      break;
  }

  // Brows
  px(g, 3, 6, look.brows, 3, 1);
  px(g, 10, 6, look.brows, 3, 1);
  // Eyes: white, iris, highlight
  for (const ex of [3, 10]) {
    px(g, ex, 7, "#f4f1ea", 3, 2);
    px(g, ex + 1, 7, look.eyes, 1, 2);
    px(g, ex + 1, 7, shade(look.eyes, 0.35), 1, 1);
  }
  // Glasses
  if (look.glasses) {
    const f = look.glasses;
    for (const ex of [2, 9]) {
      px(g, ex, 6, f, 5, 1);
      px(g, ex, 9, f, 5, 1);
      px(g, ex, 6, f, 1, 4);
      px(g, ex + 4, 6, f, 1, 4);
    }
    px(g, 7, 7, f, 2, 1);
  }
  // Nose
  px(g, 7, 9, dark, 2, 2);
  px(g, 7, 11, shade(skin, -0.28), 2, 1);
  // Mouth
  if (look.smile) {
    px(g, 5, 12, shade(skin, -0.45), 6, 1);
    px(g, 6, 13, "#f6f3ec", 4, 1);
    px(g, 5, 13, shade(skin, -0.45), 1, 1);
    px(g, 10, 13, shade(skin, -0.45), 1, 1);
    px(g, 6, 14, shade(skin, -0.4), 4, 1);
  } else {
    px(g, 6, 13, shade(skin, -0.4), 4, 1);
    px(g, 5, 12, shade(skin, -0.3), 1, 1);
    px(g, 10, 12, shade(skin, -0.3), 1, 1);
  }
  // Cheeks
  px(g, 2, 11, shade(skin, 0.08), 2, 1);
  px(g, 12, 11, shade(skin, 0.08), 2, 1);
  return c;
}

const longHair = (s: Look["style"]) => s === "long" || s === "long-wavy" || s === "bob-bangs" || s === "chin";

/** Side of the head, 16 x 16. mirror = the other side. */
function sideTextureLow(look: Look, mirror: boolean) {
  const { c, g } = canvas(16, 16);
  px(g, 0, 0, look.skin, 16, 16);
  const h = look.hair;
  if (longHair(look.style)) {
    const depth = look.style === "chin" ? 12 : 16;
    px(g, 0, 0, h, 16, 5);
    px(g, mirror ? 0 : 6, 5, h, 10, depth - 5);
  } else {
    px(g, 0, 0, h, 16, 5);
    px(g, mirror ? 0 : 10, 5, h, 6, 4);
    if (look.temples) px(g, mirror ? 11 : 1, 4, look.temples, 4, 2);
  }
  // Ear
  px(g, 7, 7, shade(look.skin, -0.12), 2, 3);
  if (longHair(look.style)) px(g, 7, 7, look.hair, 2, 3);
  return c;
}

function backTextureLow(look: Look) {
  const { c, g } = canvas(16, 16);
  px(g, 0, 0, look.hair, 16, 16);
  if (!longHair(look.style)) px(g, 3, 12, look.skin, 10, 4); // neck under short hair
  if (look.style === "chin") px(g, 0, 13, look.skin, 16, 3);
  for (let i = 0; i < 10; i++) px(g, (i * 5) % 16, (i * 7) % 16, shade(look.hair, 0.12));
  return c;
}

function topTextureLow(look: Look) {
  const { c, g } = canvas(16, 16);
  px(g, 0, 0, look.hair, 16, 16);
  for (let i = 0; i < 14; i++) px(g, (i * 7) % 16, (i * 5) % 16, shade(look.hair, 0.14));
  if (look.style === "short-side") px(g, 6, 0, shade(look.hair, -0.3), 1, 16); // parting
  if (look.style === "long" || look.style === "chin") px(g, 8, 0, shade(look.hair, -0.35), 1, 10);
  return c;
}

function hairBlockTextureLow(look: Look) {
  const { c, g } = canvas(8, 16);
  px(g, 0, 0, look.hair, 8, 16);
  for (let y = 0; y < 16; y += 3) px(g, (y * 3) % 8, y, shade(look.hair, look.style === "long-wavy" ? 0.25 : 0.12), 2, 1);
  return c;
}

/* ─────────────────────────────── Body ─────────────────────────────── */

function shirtBase(g: Ctx, k: Kit, w: number, h: number, front: boolean) {
  px(g, 0, 0, k.shirt, w, h);
  switch (k.pattern) {
    case "sash":
      for (let y = 0; y < h; y++) px(g, Math.round((y / h) * w) - 3, y, k.trim, 6, 1);
      break;
    case "band":
      px(g, 0, Math.round(h * 0.32), k.trim, w, 4);
      px(g, 0, Math.round(h * 0.32) + 4, shade(k.trim, 0.5), w, 1);
      break;
    case "sleeves":
      px(g, 0, 0, k.trim, w, 4);
      break;
    case "side":
      px(g, 0, 0, k.trim, 2, h);
      px(g, w - 2, 0, k.trim, 2, h);
      break;
    case "pirate":
      for (let x = 1; x < w; x += 4) px(g, x, 0, shade(k.shirt, 0.18), 1, h);
      break;
  }
  if (front) {
    // V-neck collar
    px(g, w / 2 - 4, 0, k.trim, 8, 1);
    px(g, w / 2 - 3, 1, k.trim, 2, 1);
    px(g, w / 2 + 1, 1, k.trim, 2, 1);
    px(g, w / 2 - 2, 2, k.trim, 4, 1);
    px(g, w / 2 - 1, 1, shade(k.shirt, -0.2), 2, 1);
  }
}

function skull(g: Ctx, cx: number, cy: number) {
  const gold = "#ffb81c";
  const bone = "#f4ead2";
  // crossbones
  for (let i = 0; i < 8; i++) {
    px(g, cx - 4 + i, cy + 2 + Math.floor(i / 2), gold);
    px(g, cx + 3 - i, cy + 2 + Math.floor(i / 2), gold);
  }
  px(g, cx - 3, cy - 3, bone, 6, 5);
  px(g, cx - 2, cy + 2, bone, 4, 2);
  px(g, cx - 2, cy - 1, "#141210", 1, 2);
  px(g, cx + 1, cy - 1, "#141210", 1, 2);
}

function torsoFrontLow(k: Kit, number: number) {
  const { c, g } = canvas(32, 40);
  shirtBase(g, k, 32, 40, true);
  if (k.pattern === "pirate") skull(g, 16, 14);
  else text(g, String(number), 22, 8, k.number, 1);
  // Badge
  if (k.pattern !== "pirate") px(g, 8, 8, shade(k.trim, 0.2), 3, 4);
  // Shorts line at the bottom edge
  px(g, 0, 38, shade(k.shirt, -0.2), 32, 2);
  return c;
}

function torsoBackLow(k: Kit, name: string, number: number) {
  const { c, g } = canvas(32, 40);
  shirtBase(g, k, 32, 40, false);
  const n = name.slice(0, 7);
  text(g, n, 16, 5, k.number, 1);
  text(g, String(number), 16, 14, k.number, 3);
  px(g, 0, 38, shade(k.shirt, -0.2), 32, 2);
  return c;
}

export function plainTexture(color: string, w = 8, h = 8, accent?: string) {
  const { c, g } = canvas(w, h);
  px(g, 0, 0, color, w, h);
  if (accent) px(g, 0, 0, accent, w, 1);
  return c;
}

/** Arm: sleeve on top, skin (or keeper sleeve) below. 8 x 24. */
function armTextureLow(k: Kit, skin: string, keeper: boolean) {
  const { c, g } = canvas(8, 24);
  px(g, 0, 0, k.shirt, 8, keeper ? 24 : 9);
  px(g, 0, 8, k.trim, 8, 1);
  if (!keeper) px(g, 0, 9, skin, 8, 15);
  if (keeper) px(g, 0, 20, k.trim, 8, 1);
  return c;
}

/** Leg: shorts, skin, sock. 8 x 32. */
function legTextureLow(k: Kit, skin: string) {
  const { c, g } = canvas(8, 32);
  px(g, 0, 0, k.shorts, 8, 11);
  px(g, 0, 10, shade(k.shorts, -0.15), 8, 1);
  px(g, 0, 11, skin, 8, 6);
  px(g, 0, 17, k.socks, 8, 15);
  px(g, 0, 17, shade(k.socks, -0.2), 8, 1);
  return c;
}

/* ───────────────────────── High-detail layer ───────────────────────── */

/*
 * Each texture is laid out on the small pixel grid above, then doubled and
 * finished at full resolution: lighting across the form, fabric weave and
 * folds on the kits, strands in the hair, and real eye, nose and lip detail.
 */

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** A small deterministic hash, so textures look the same every time. */
const hash = (x: number, y: number, seed: number) => {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

function upscale(src: HTMLCanvasElement, k = 2) {
  const out = canvas(src.width * k, src.height * k);
  out.g.drawImage(src, 0, 0, out.c.width, out.c.height);
  return out;
}

/**
 * Scale the brightness of pixels: `light(x, y)` gives a factor (1 = unchanged).
 * With `only`, just the pixels of that exact colour change.
 */
function relight(g: Ctx, w: number, h: number, light: (x: number, y: number) => number, only?: string) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const want = only ? rgb(only) : null;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (want && (d[i] !== want[0] || d[i + 1] !== want[1] || d[i + 2] !== want[2])) continue;
      const f = light(x, y);
      d[i] = Math.min(255, d[i] * f);
      d[i + 1] = Math.min(255, d[i + 1] * f);
      d[i + 2] = Math.min(255, d[i + 2] * f);
    }
  g.putImageData(img, 0, 0);
}

/** Strands: streaks of lighter and darker hair, mostly running downwards. */
function hairGrain(g: Ctx, w: number, h: number, hair: string, seed: number) {
  // Dark hair needs strong highlights to show strands; light hair only a hint
  const [r, gr, b] = rgb(hair);
  const lum = (0.3 * r + 0.59 * gr + 0.11 * b) / 255;
  const hi = 1 + 0.34 * (1 - lum);
  const lo = 1 - 0.12 - 0.1 * lum;
  relight(
    g,
    w,
    h,
    (x, y) => {
      const strand = hash(x, Math.floor(y / 3), seed);
      const sheen = y < h * 0.3 ? 1.1 : 1;
      return (strand > 0.82 ? hi : strand < 0.18 ? lo : 1) * (lum > 0.6 ? 1 : sheen);
    },
    hair,
  );
}

const lipColor = (skin: string) => {
  const [r, g, b] = rgb(skin);
  return `rgb(${Math.round(r * 0.78 + 40)},${Math.round(g * 0.55)},${Math.round(b * 0.58)})`;
};

/** The face, 32 x 32. */
export function faceTexture(look: Look) {
  const { c, g } = upscale(faceTextureLow(look));
  const skin = look.skin;
  const P = (x: number, y: number, color: string, w = 1, h = 1) => px(g, x, y, color, w, h);
  // Clear the feature area and redraw it at full detail
  P(4, 14, skin, 24, 16);
  // Brows: a little thinner towards the outside
  P(6, 12, skin);
  P(25, 12, skin);
  P(6, 13, shade(look.brows, 0.15));
  P(25, 13, shade(look.brows, 0.15));
  // Eyes: lid line, white, iris with pupil and catch-light, a soft shadow below
  for (const [ex, ix] of [
    [6, 8],
    [20, 22],
  ]) {
    P(ex, 14, shade(skin, -0.42), 6, 1);
    P(ex, 15, "#f2eee6", 6, 2);
    P(ix, 15, look.eyes, 2, 2);
    P(ix, 16, shade(look.eyes, -0.5), 2, 1);
    P(ix, 15, shade(look.eyes, 0.55), 1, 1);
    P(ex, 17, shade(skin, -0.12), 6, 1);
    P(ex - 1, 14, shade(skin, -0.25));
    P(ex + 6, 14, shade(skin, -0.25));
  }
  // Nose: lit bridge, shaded side, tip and nostrils
  P(15, 16, shade(skin, 0.1), 2, 4);
  P(14, 17, shade(skin, -0.08), 1, 4);
  P(13, 21, shade(skin, -0.16), 6, 1);
  P(14, 22, shade(skin, -0.3));
  P(17, 22, shade(skin, -0.3));
  P(15, 22, shade(skin, -0.12), 2, 1);
  // Philtrum
  P(15, 23, shade(skin, -0.06), 2, 1);
  // Mouth
  const lip = lipColor(skin);
  if (look.smile) {
    P(10, 24, shade(skin, -0.3));
    P(21, 24, shade(skin, -0.3));
    P(11, 25, shade(lip, -0.25), 10, 1);
    P(12, 26, "#f6f2ea", 8, 1);
    P(11, 26, shade(skin, -0.45));
    P(20, 26, shade(skin, -0.45));
    P(12, 27, lip, 8, 1);
    P(13, 28, shade(lip, 0.18), 6, 1);
  } else {
    P(12, 25, shade(lip, -0.12), 8, 1);
    P(11, 26, shade(skin, -0.4), 10, 1);
    P(12, 27, lip, 8, 1);
    P(13, 27, shade(lip, 0.15), 3, 1);
  }
  // Chin and jaw shadow
  P(13, 29, shade(skin, 0.06), 6, 1);
  // Warm cheeks
  g.fillStyle = "rgba(220, 90, 80, 0.14)";
  g.fillRect(5, 20, 4, 3);
  g.fillRect(23, 20, 4, 3);
  // Glasses over the eyes
  if (look.glasses) {
    const f = look.glasses;
    for (const ex of [4, 18]) {
      P(ex, 12, f, 10, 1);
      P(ex, 19, f, 10, 1);
      P(ex, 12, f, 1, 8);
      P(ex + 9, 12, f, 1, 8);
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.fillRect(ex + 1, 13, 3, 1);
    }
    P(14, 14, f, 4, 1);
  }
  // Light from above and the front: brighter forehead, rounder sides, shadowed jaw
  relight(
    g,
    32,
    32,
    (x, y) => {
      const side = Math.abs(x - 15.5) / 15.5;
      return 1.06 - 0.12 * side * side - (y > 27 ? 0.08 : 0) - (y < 12 ? -0.03 : 0);
    },
    skin,
  );
  hairGrain(g, 32, 32, look.hair, 1);
  return c;
}

export function sideTexture(look: Look, mirror: boolean) {
  const { c, g } = upscale(sideTextureLow(look, mirror));
  // Ear detail
  if (!longHair(look.style)) {
    px(g, 14, 15, shade(look.skin, -0.25), 4, 5);
    px(g, 15, 16, shade(look.skin, -0.05), 2, 3);
  }
  relight(g, 32, 32, (_x, y) => 0.94 - (y > 27 ? 0.08 : 0), look.skin);
  hairGrain(g, 32, 32, look.hair, mirror ? 2 : 3);
  return c;
}

export function backTexture(look: Look) {
  const { c, g } = upscale(backTextureLow(look));
  hairGrain(g, 32, 32, look.hair, 4);
  relight(g, 32, 32, () => 0.88, look.skin);
  return c;
}

export function topTexture(look: Look) {
  const { c, g } = upscale(topTextureLow(look));
  hairGrain(g, 32, 32, look.hair, 5);
  return c;
}

export function hairBlockTexture(look: Look) {
  const { c, g } = upscale(hairBlockTextureLow(look));
  hairGrain(g, 16, 32, look.hair, 6);
  return c;
}

/** Fabric: light from the top left, darker sides, a fine mesh and soft folds. */
function fabric(g: Ctx, w: number, h: number, seed: number) {
  relight(g, w, h, (x, y) => {
    const side = Math.abs(x - w / 2) / (w / 2);
    const mesh = (x + y) % 2 === 0 ? 1.03 : 0.98;
    const fold = 1 - 0.07 * Math.max(0, Math.sin((x * 0.9 + y * 0.35 + seed) * 0.42)) * (y / h);
    return (1.08 - 0.16 * side * side - 0.08 * (y / h)) * mesh * fold;
  });
}

/** A shield crest in the kit's trim colour (a generic badge, not a federation crest). */
function crest(g: Ctx, x: number, y: number, k: Kit) {
  const edge = shade(k.trim, -0.25);
  px(g, x, y, edge, 8, 1);
  px(g, x, y, edge, 1, 7);
  px(g, x + 7, y, edge, 1, 7);
  px(g, x + 1, y + 7, edge, 6, 1);
  px(g, x + 2, y + 8, edge, 4, 1);
  px(g, x + 1, y + 1, k.trim, 6, 6);
  px(g, x + 2, y + 7, k.trim, 4, 1);
  // Star
  px(g, x + 3, y + 2, k.shirt, 2, 4);
  px(g, x + 2, y + 3, k.shirt, 4, 2);
  px(g, x + 1, y + 1, shade(k.trim, 0.4), 2, 1);
}

export function torsoFront(k: Kit, number: number) {
  const { c, g } = upscale(torsoFrontLow(k, number));
  if (k.pattern !== "pirate") {
    // Swap the little badge for a crest
    px(g, 16, 16, k.shirt, 6, 8);
    crest(g, 15, 14, k);
  }
  // Ribbed collar
  for (let x = 24; x < 40; x += 2) px(g, x, 0, shade(k.trim, -0.2), 1, 2);
  fabric(g, 64, 80, 1);
  // Seam between shirt and shorts
  px(g, 0, 75, "rgba(0,0,0,0.25)", 64, 1);
  return c;
}

export function torsoBack(k: Kit, name: string, number: number) {
  const { c, g } = upscale(torsoBackLow(k, name, number));
  fabric(g, 64, 80, 7);
  return c;
}

export function armTexture(k: Kit, skin: string, keeper: boolean) {
  const { c, g } = upscale(armTextureLow(k, skin, keeper));
  // Cuff rib
  px(g, 0, 15, shade(k.trim, 0.25), 16, 1);
  relight(g, 16, 48, (x, y) => 1.05 - 0.14 * Math.abs(x - 7.5) / 7.5 - (y < 18 && !keeper ? 0 : 0.02));
  return c;
}

export function legTexture(k: Kit, skin: string) {
  const { c, g } = upscale(legTextureLow(k, skin));
  // Sock ribbing and the turned-over top
  for (let y = 38; y < 64; y += 2) px(g, 0, y, "rgba(0,0,0,0.07)", 16, 1);
  px(g, 0, 34, shade(k.socks, 0.2), 16, 2);
  relight(g, 16, 64, (x) => 1.05 - 0.16 * Math.abs(x - 7.5) / 7.5);
  return c;
}

/** Shin and sock below the knee, with ribbing and a shin pad bump. */
export function sockTexture(k: Kit) {
  const { c, g } = canvas(16, 32);
  px(g, 0, 0, k.socks, 16, 32);
  for (let y = 1; y < 32; y += 2) px(g, 0, y, "rgba(0,0,0,0.07)", 16, 1);
  px(g, 3, 4, "rgba(255,255,255,0.08)", 10, 16);
  px(g, 0, 26, shade(k.trim, 0), 16, 2);
  relight(g, 16, 32, (x) => 1.04 - 0.16 * Math.abs(x - 7.5) / 7.5);
  return c;
}

/* ──────────────────────────── 2D portraits ─────────────────────────── */

/**
 * A flat front view of a player's blocky character for menus and the
 * scoreboard, drawn from the same textures as the 3D model.
 */
export function cardPortrait(p: Player, size = 120, full = true) {
  const scale = size / (full ? 40 : 16);
  const w = full ? 32 : 16;
  const h = full ? 40 : 16;
  const { c, g } = canvas(Math.round(w * scale), Math.round(h * scale));
  g.imageSmoothingEnabled = false;
  const k = p.kit;
  const L = p.look;
  const draw = (img: HTMLCanvasElement, x: number, y: number, ww: number, hh: number) =>
    g.drawImage(img, Math.round(x * scale), Math.round(y * scale), Math.round(ww * scale), Math.round(hh * scale));
  if (!full) {
    draw(faceTexture(L), 0, 0, 16, 16);
    return c;
  }
  // Long hair falls behind the shoulders
  if (L.style === "long" || L.style === "long-wavy") draw(hairBlockTexture(L), 8, 6, 16, 14);
  // Legs
  draw(legTexture(k, L.skin), 10, 26, 5, 12);
  draw(legTexture(k, L.skin), 17, 26, 5, 12);
  px(g, Math.round(10 * scale), Math.round(38 * scale), "#14171d", Math.round(5 * scale), Math.round(2 * scale));
  px(g, Math.round(17 * scale), Math.round(38 * scale), "#14171d", Math.round(5 * scale), Math.round(2 * scale));
  // Arms
  draw(armTexture(k, L.skin, false), 4.5, 15, 4, 11);
  draw(armTexture(k, L.skin, false), 23.5, 15, 4, 11);
  // Torso
  draw(torsoFront(k, p.number), 8.5, 15, 15, 12);
  // Head
  draw(faceTexture(L), 8, 1, 16, 14);
  if (L.style === "braids-up") px(g, Math.round(12 * scale), 0, L.hair, Math.round(8 * scale), Math.round(2 * scale));
  return c;
}
