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

export type HairStyle =
  | "bob-bangs"
  | "chin"
  | "long"
  | "long-wavy"
  | "curly-short"
  | "short-up"
  | "short-messy"
  | "short-side"
  | "braids-up";

/** How each person's blocky character looks, matched to their portrait on the team site. */
export interface Look {
  skin: string;
  hair: string;
  style: HairStyle;
  eyes: string;
  brows: string;
  /** Frame colour, when the person wears glasses. */
  glasses?: string;
  /** Showing teeth in the portrait. */
  smile: boolean;
  /** Grey at the temples. */
  temples?: string;
}

const looks: Record<string, Look> = {
  Asin: { skin: "#a87556", hair: "#151215", style: "bob-bangs", eyes: "#2a1a12", brows: "#151215", glasses: "#b9a27a", smile: false },
  Emma: { skin: "#f1ccb4", hair: "#8a5a3c", style: "chin", eyes: "#4a3a2a", brows: "#7a4e33", smile: true },
  Alyanna: { skin: "#c99272", hair: "#1d1512", style: "long", eyes: "#2a1a12", brows: "#1d1512", smile: true },
  Elias: { skin: "#c08b69", hair: "#120e0d", style: "curly-short", eyes: "#22150f", brows: "#120e0d", smile: false },
  Juan: { skin: "#d8a684", hair: "#121111", style: "short-up", eyes: "#22150f", brows: "#121111", glasses: "#cbb48a", smile: false },
  Cody: { skin: "#e6bea2", hair: "#4a2e1f", style: "short-messy", eyes: "#3a2a1c", brows: "#2e1c12", smile: false },
  Jade: { skin: "#5c3826", hair: "#0d0b0b", style: "braids-up", eyes: "#1a100a", brows: "#0d0b0b", smile: true },
  Debika: { skin: "#a8755a", hair: "#120f0f", style: "long", eyes: "#22150f", brows: "#120f0f", smile: true },
  Abby: { skin: "#f0c6ae", hair: "#e6a1b6", style: "long-wavy", eyes: "#4a3a2a", brows: "#9a6a5a", smile: true },
  Adrian: { skin: "#cf9e7f", hair: "#2a2523", style: "short-side", eyes: "#22150f", brows: "#2a2523", smile: false, temples: "#8a8580" },
};

/** Every player has the same total; they just play differently. Values run 1 to 5. */
export interface Stats {
  power: number;
  accuracy: number;
  reflex: number;
  reach: number;
}

export interface Player {
  id: string;
  name: string;
  firstName: string;
  /** Name on the back of the shirt. */
  shirtName: string;
  number: number;
  role: "Student" | "Coach";
  country: string;
  flag: string;
  kit: Kit;
  look: Look;
  style: string;
  stats: Stats;
}

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
      firstName: m.firstName,
      shirtName: m.firstName.toUpperCase(),
      number: s.number,
      role: "Student" as const,
      country: m.country,
      flag: flags[m.country] ?? "",
      kit: kits[m.country],
      look: looks[m.firstName],
      style: s.style,
      stats: s.stats,
    };
  }),
  ...coaches.map((c) => {
    const s = styles[c.firstName];
    return {
      id: c.firstName.toLowerCase(),
      name: c.honorific ? `${c.honorific} ${c.name}` : c.name,
      firstName: c.firstName,
      shirtName: lastName(c.name).toUpperCase(),
      number: s.number,
      role: "Coach" as const,
      country: "Southwestern University",
      flag: "🏴‍☠️",
      kit: kits.Pirates,
      look: looks[c.firstName],
      style: s.style,
      stats: s.stats,
    };
  }),
];

export const byId = (id: string) => roster.find((p) => p.id === id) ?? roster[0];
