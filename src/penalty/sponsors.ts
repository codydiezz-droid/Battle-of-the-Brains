/*
 * Sponsor boards, drawn in code on canvases (no image files to load).
 * The marks are simplified versions in each brand's colours, standing in for
 * the 2026 HSI Battle of the Brains sponsors.
 */

type Ctx = CanvasRenderingContext2D;
const SANS = "Arial Black, Arial, Helvetica, sans-serif";

export interface Tile {
  bg: string;
  draw: (g: Ctx, w: number, h: number) => void;
}

function centred(g: Ctx, text: string, x: number, y: number, size: number, color: string, weight = 900) {
  g.font = `${weight} ${size}px ${SANS}`;
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, x, y);
}

/** Fit text to a width by shrinking the font. */
function fit(g: Ctx, text: string, max: number, size: number, weight = 900) {
  let s = size;
  g.font = `${weight} ${s}px ${SANS}`;
  while (g.measureText(text).width > max && s > 8) {
    s -= 1;
    g.font = `${weight} ${s}px ${SANS}`;
  }
  return s;
}

/**
 * A shield with "SU" in Southwestern black and gold. A stand-in for the
 * university's official logo: replace with the real artwork when available.
 */
export function suBadge(g: Ctx, x: number, y: number, h: number) {
  const w = h * 0.86;
  const shield = (inset: number) => {
    g.beginPath();
    g.moveTo(x + inset, y + inset);
    g.lineTo(x + w - inset, y + inset);
    g.lineTo(x + w - inset, y + h * 0.55);
    g.quadraticCurveTo(x + w - inset, y + h * 0.85, x + w / 2, y + h - inset);
    g.quadraticCurveTo(x + inset, y + h * 0.85, x + inset, y + h * 0.55);
    g.closePath();
  };
  shield(0);
  g.fillStyle = "#141210";
  g.fill();
  shield(h * 0.06);
  g.lineWidth = h * 0.05;
  g.strokeStyle = "#ffb81c";
  g.stroke();
  g.font = `900 ${h * 0.46}px ${SANS}`;
  g.fillStyle = "#ffb81c";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("SU", x + w / 2, y + h * 0.47);
}

export const tiles: Record<string, Tile> = {
  homeDepot: {
    bg: "#ffffff",
    draw(g, w, h) {
      // Orange square with the name set diagonally, beside the wordmark
      const s = h * 0.82;
      const x = w * 0.08;
      const y = (h - s) / 2;
      g.fillStyle = "#f96302";
      g.fillRect(x, y, s, s);
      g.save();
      g.translate(x + s / 2, y + s / 2);
      g.rotate(-Math.PI / 4.6);
      const size = s * 0.2;
      centred(g, "THE", 0, -size * 1.05, size * 0.8, "#ffffff");
      centred(g, "HOME", 0, 0, size, "#ffffff");
      centred(g, "DEPOT", 0, size * 1.05, size, "#ffffff");
      g.restore();
      const tx = x + s + w * 0.05;
      const size2 = fit(g, "The Home Depot", w - tx - w * 0.05, h * 0.38);
      g.font = `900 ${size2}px ${SANS}`;
      g.fillStyle = "#f96302";
      g.textAlign = "left";
      g.textBaseline = "middle";
      g.fillText("The Home Depot", tx, h / 2);
    },
  },
  crowdStrike: {
    bg: "#0d0f12",
    draw(g, w, h) {
      // A swooping falcon shape and the wordmark
      g.fillStyle = "#e3242b";
      const x = w * 0.08;
      const y = h * 0.5;
      const s = h * 0.34;
      g.beginPath();
      g.moveTo(x, y - s * 0.2);
      g.quadraticCurveTo(x + s * 1.2, y - s * 1.3, x + s * 2.4, y - s * 0.4);
      g.quadraticCurveTo(x + s * 1.5, y - s * 0.55, x + s * 1.3, y + s * 0.2);
      g.quadraticCurveTo(x + s * 1.9, y + s * 0.1, x + s * 2.2, y + s * 0.9);
      g.quadraticCurveTo(x + s * 1.1, y + s * 0.3, x, y - s * 0.2);
      g.fill();
      const tx = x + s * 2.7;
      const size = fit(g, "CROWDSTRIKE", w - tx - w * 0.04, h * 0.42);
      g.font = `900 ${size}px ${SANS}`;
      g.textAlign = "left";
      g.textBaseline = "middle";
      g.fillStyle = "#ffffff";
      g.fillText("CROWD", tx, h / 2);
      const cw = g.measureText("CROWD").width;
      g.fillStyle = "#e3242b";
      g.fillText("STRIKE", tx + cw, h / 2);
    },
  },
  dell: {
    bg: "#ffffff",
    draw(g, w, h) {
      // Ring with DELL and the tilted E
      const r = h * 0.4;
      const cx = w / 2;
      const cy = h / 2;
      g.strokeStyle = "#007db8";
      g.lineWidth = h * 0.07;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
      const size = r * 0.72;
      g.font = `900 ${size}px ${SANS}`;
      g.fillStyle = "#007db8";
      g.textBaseline = "middle";
      g.textAlign = "center";
      const step = size * 0.55;
      g.fillText("D", cx - step * 1.5, cy);
      g.save();
      g.translate(cx - step * 0.5, cy);
      g.rotate(-0.45);
      g.fillText("E", 0, 0);
      g.restore();
      g.fillText("L", cx + step * 0.5, cy);
      g.fillText("L", cx + step * 1.4, cy);
      // Wordmark on either side for long boards
      g.font = `700 ${h * 0.22}px Arial, Helvetica, sans-serif`;
      g.fillText("Technologies", cx + r + w * 0.17, cy);
    },
  },
  ebay: {
    bg: "#ffffff",
    draw(g, w, h) {
      // Four overlapping lowercase letters in the brand colours
      const size = h * 0.78;
      g.font = `700 ${size}px Arial, Helvetica, sans-serif`;
      g.textBaseline = "alphabetic";
      g.textAlign = "left";
      const letters: [string, string][] = [
        ["e", "#e53238"],
        ["b", "#0064d2"],
        ["a", "#f5af02"],
        ["y", "#86b817"],
      ];
      const total = letters.reduce((a, [l]) => a + g.measureText(l).width * 0.86, 0);
      let x = w / 2 - total / 2;
      const base = h * 0.72;
      for (const [l, c] of letters) {
        g.fillStyle = c;
        g.fillText(l, x, base + (l === "y" ? -h * 0.02 : 0));
        x += g.measureText(l).width * 0.86;
      }
    },
  },
  oneBridge: {
    bg: "#091d3f",
    draw(g, w, h) {
      const grad = g.createLinearGradient(w * 0.08, 0, w * 0.3, 0);
      grad.addColorStop(0, "#3d8bff");
      grad.addColorStop(0.5, "#dfe9ff");
      grad.addColorStop(1, "#f68835");
      g.strokeStyle = grad;
      g.lineWidth = h * 0.1;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(w * 0.08, h * 0.72);
      g.bezierCurveTo(w * 0.13, h * 0.2, w * 0.25, h * 0.2, w * 0.3, h * 0.72);
      g.stroke();
      const size = fit(g, "OneBridge", w * 0.58, h * 0.46);
      g.font = `900 ${size}px ${SANS}`;
      g.fillStyle = "#ffffff";
      g.textAlign = "left";
      g.textBaseline = "middle";
      g.fillText("OneBridge", w * 0.36, h / 2);
    },
  },
  southwestern: {
    bg: "#141210",
    draw(g, w, h) {
      const size = fit(g, "SOUTHWESTERN UNIVERSITY", w * 0.9, h * 0.34);
      centred(g, "SOUTHWESTERN UNIVERSITY", w / 2, h / 2, size, "#ffb81c");
    },
  },
  botb: {
    bg: "#0b4d2c",
    draw(g, w, h) {
      const size = fit(g, "HSI BATTLE OF THE BRAINS", w * 0.9, h * 0.32);
      centred(g, "HSI BATTLE OF THE BRAINS", w / 2, h * 0.42, size, "#ffd23f");
      centred(g, "2026", w / 2, h * 0.78, h * 0.2, "#ffffff", 700);
    },
  },
  pirates: {
    bg: "#ffb81c",
    draw(g, w, h) {
      // SU badge (a stand-in until the official Southwestern mark is added), then GO PIRATES
      suBadge(g, w * 0.06, h * 0.1, h * 0.8);
      const x = w * 0.06 + h * 0.8 * 0.86 + w * 0.05;
      const size = fit(g, "GO PIRATES", w - x - w * 0.05, h * 0.48);
      g.font = `900 ${size}px ${SANS}`;
      g.fillStyle = "#141210";
      g.textAlign = "left";
      g.textBaseline = "middle";
      g.fillText("GO PIRATES", x, h / 2);
    },
  },
};

/** The order sponsors appear along a board. */
export const boardOrder = ["homeDepot", "oneBridge", "crowdStrike", "southwestern", "dell", "botb", "ebay", "pirates"];

/** One long strip of sponsor tiles, for LED boards and the stand fascia. */
export function sponsorStrip(tileW: number, tileH: number, order = boardOrder) {
  const c = document.createElement("canvas");
  c.width = tileW * order.length;
  c.height = tileH;
  const g = c.getContext("2d")!;
  order.forEach((key, i) => {
    const t = tiles[key];
    g.save();
    g.translate(i * tileW, 0);
    g.fillStyle = t.bg;
    g.fillRect(0, 0, tileW, tileH);
    g.beginPath();
    g.rect(0, 0, tileW, tileH);
    g.clip();
    t.draw(g, tileW, tileH);
    g.restore();
    // A thin divider between boards
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.fillRect(i * tileW, 0, 2, tileH);
  });
  return c;
}
