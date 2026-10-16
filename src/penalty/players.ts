import { coaches, team } from "../data/siteData";

/** A shirt, shorts and socks, drawn in code (no real federation crests or logos). */
export interface Kit {
  label: string;
  shirt: string;
  trim: string;
  shorts: string;
  socks: string;
  number: string;
  /** How the shirt is decorated. */
  pattern: "plain" | "sash" | "band" | "sleeves" | "side" | "pirate";
}

export const kits: Record<string, Kit> = {
  India: { label: "India", shirt: "#1d63c9", trim: "#ff9933", shorts: "#ffffff", socks: "#1d63c9", number: "#ffffff", pattern: "side" },
  "United States": { label: "United States", shirt: "#ffffff", trim: "#1b2a5c", shorts: "#1b2a5c", socks: "#ffffff", number: "#1b2a5c", pattern: "band" },
  Mexico: { label: "Mexico", shirt: "#0b6b3a", trim: "#ce1126", shorts: "#ffffff", socks: "#ce1126", number: "#ffffff", pattern: "sash" },
  Pakistan: { label: "Pakistan", shirt: "#0b5d2c", trim: "#ffffff", shorts: "#0b5d2c", socks: "#ffffff", number: "#ffffff", pattern: "sleeves" },
  Spain: { label: "Spain", shirt: "#c60b1e", trim: "#ffc400", shorts: "#1b2a5c", socks: "#1b2a5c", number: "#ffc400", pattern: "side" },
  Cameroon: { label: "Cameroon", shirt: "#007a3d", trim: "#fcd116", shorts: "#ce1126", socks: "#fcd116", number: "#fcd116", pattern: "band" },
  // Southwestern University Pirates, for the coaches.
  Pirates: { label: "SU Pirates", shirt: "#141210", trim: "#ffb81c", shorts: "#141210", socks: "#ffb81c", number: "#ffb81c", pattern: "pirate" },
};

/**
 * Every player is balanced (the same total), they just play differently.
 * Values run 1 to 5.
 */
export interface Stats {
  power: number;
  accuracy: number;
  reflex: number;
  reach: number;
}

export interface Player {
  id: string;
  name: string;
  /** Name on the back of the shirt. */
  shirtName: string;
  number: number;
  role: "Student" | "Coach";
  country: string;
  flag: string;
  kit: Kit;
  face: string;
  /** Crop of the portrait used for the face: centre (0 to 1) and size of the square. */
  faceCrop: { cx: number; cy: number; size: number };
  style: string;
  stats: Stats;
}

// One style per person, all with the same total of 12.
const styles: Record<string, { style: string; stats: Stats; number: number }> = {
  Asin: { style: "Picks the corner", stats: { power: 2, accuracy: 5, reflex: 3, reach: 2 }, number: 8 },
  Emma: { style: "Ice cold", stats: { power: 3, accuracy: 4, reflex: 2, reach: 3 }, number: 4 },
  Alyanna: { style: "Quick hands", stats: { power: 2, accuracy: 3, reflex: 5, reach: 2 }, number: 10 },
  Elias: { style: "Big boot", stats: { power: 5, accuracy: 2, reflex: 2, reach: 3 }, number: 9 },
  Juan: { style: "Cool finisher", stats: { power: 3, accuracy: 4, reflex: 3, reach: 2 }, number: 11 },
  Cody: { style: "Top bins", stats: { power: 4, accuracy: 3, reflex: 2, reach: 3 }, number: 7 },
  Jade: { style: "Long arms", stats: { power: 3, accuracy: 2, reflex: 2, reach: 5 }, number: 6 },
  Debika: { style: "Reads the game", stats: { power: 2, accuracy: 3, reflex: 4, reach: 3 }, number: 1 },
  Abby: { style: "Steady", stats: { power: 3, accuracy: 3, reflex: 3, reach: 3 }, number: 12 },
  Adrian: { style: "Wall", stats: { power: 3, accuracy: 2, reflex: 3, reach: 4 }, number: 13 },
};

const flags: Record<string, string> = {
  India: "🇮🇳",
  "United States": "🇺🇸",
  Mexico: "🇲🇽",
  Pakistan: "🇵🇰",
  Spain: "🇪🇸",
  Cameroon: "🇨🇲",
};

const lastName = (name: string) => name.split(" ").pop() ?? name;

export const roster: Player[] = [
  ...team.map((m) => {
    const s = styles[m.firstName];
    return {
      id: m.firstName.toLowerCase(),
      name: m.name,
      shirtName: m.firstName.toUpperCase(),
      number: s.number,
      role: "Student" as const,
      country: m.country,
      flag: flags[m.country] ?? "",
      kit: kits[m.country],
      face: m.image ?? "",
      faceCrop: { cx: 0.5, cy: 0.4, size: 0.62 },
      style: s.style,
      stats: s.stats,
    };
  }),
  ...coaches.map((c) => {
    const s = styles[c.firstName];
    return {
      id: c.firstName.toLowerCase(),
      name: c.honorific ? `${c.honorific} ${c.name}` : c.name,
      shirtName: lastName(c.name).toUpperCase(),
      number: s.number,
      role: "Coach" as const,
      country: "Southwestern University",
      flag: "🏴‍☠️",
      kit: kits.Pirates,
      face: c.image ?? "",
      faceCrop: { cx: 0.5, cy: 0.42, size: 0.66 },
      style: s.style,
      stats: s.stats,
    };
  }),
];
