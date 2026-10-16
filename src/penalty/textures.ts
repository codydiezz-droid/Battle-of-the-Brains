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
export function faceTexture(look: Look) {
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
export function sideTexture(look: Look, mirror: boolean) {
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

export function backTexture(look: Look) {
  const { c, g } = canvas(16, 16);
  px(g, 0, 0, look.hair, 16, 16);
  if (!longHair(look.style)) px(g, 3, 12, look.skin, 10, 4); // neck under short hair
  if (look.style === "chin") px(g, 0, 13, look.skin, 16, 3);
  for (let i = 0; i < 10; i++) px(g, (i * 5) % 16, (i * 7) % 16, shade(look.hair, 0.12));
  return c;
}

export function topTexture(look: Look) {
  const { c, g } = canvas(16, 16);
  px(g, 0, 0, look.hair, 16, 16);
  for (let i = 0; i < 14; i++) px(g, (i * 7) % 16, (i * 5) % 16, shade(look.hair, 0.14));
  if (look.style === "short-side") px(g, 6, 0, shade(look.hair, -0.3), 1, 16); // parting
  if (look.style === "long" || look.style === "chin") px(g, 8, 0, shade(look.hair, -0.35), 1, 10);
  return c;
}

export function hairBlockTexture(look: Look) {
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

export function torsoFront(k: Kit, number: number) {
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

export function torsoBack(k: Kit, name: string, number: number) {
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
export function armTexture(k: Kit, skin: string, keeper: boolean) {
  const { c, g } = canvas(8, 24);
  px(g, 0, 0, k.shirt, 8, keeper ? 24 : 9);
  px(g, 0, 8, k.trim, 8, 1);
  if (!keeper) px(g, 0, 9, skin, 8, 15);
  if (keeper) px(g, 0, 20, k.trim, 8, 1);
  return c;
}

/** Leg: shorts, skin, sock. 8 x 32. */
export function legTexture(k: Kit, skin: string) {
  const { c, g } = canvas(8, 32);
  px(g, 0, 0, k.shorts, 8, 11);
  px(g, 0, 10, shade(k.shorts, -0.15), 8, 1);
  px(g, 0, 11, skin, 8, 6);
  px(g, 0, 17, k.socks, 8, 15);
  px(g, 0, 17, shade(k.socks, -0.2), 8, 1);
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
