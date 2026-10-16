import { celebrations } from "./celebrations";
import { persist, save } from "./storage";

/*
 * Progression: XP from every match, levels that unlock celebrations,
 * achievements, and a daily streak. Everything is kept in this browser.
 */

/** Total XP needed to reach each level (index 0 is level 1). */
const LEVELS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];

export function levelOf(xp: number) {
  let l = 1;
  while (xp >= xpFor(l + 1)) l++;
  return l;
}

/** Total XP at which a level starts. */
export function xpFor(level: number) {
  if (level <= LEVELS.length) return LEVELS[level - 1];
  return LEVELS[LEVELS.length - 1] + (level - LEVELS.length) * 550;
}

export interface Achievement {
  id: string;
  name: string;
  how: string;
}

export const achievements: Achievement[] = [
  { id: "first-goal", name: "Off the mark", how: "Score your first penalty." },
  { id: "first-save", name: "Safe hands", how: "Make your first save." },
  { id: "perfect", name: "Top bins", how: "Score with a perfect strike." },
  { id: "clinical", name: "Clinical", how: "Score 5 from 5 in the Penalty Challenge." },
  { id: "wall", name: "The wall", how: "Keep out 4 penalties in the Goalkeeper Challenge." },
  { id: "shootout", name: "Shootout hero", how: "Win a full shootout." },
  { id: "sudden", name: "Ice in the veins", how: "Win a shootout in sudden death." },
  { id: "online", name: "Online debut", how: "Finish an online match." },
  { id: "golazo", name: "Golazo", how: "Score a golazo: top corner or a thunderbolt." },
  { id: "century", name: "Twenty-five club", how: "Score 25 career penalties." },
];

/** Unlock an achievement once; returns it when it is new. */
export function unlock(id: string): Achievement | null {
  if (save.achievements.includes(id)) return null;
  const a = achievements.find((x) => x.id === id);
  if (!a) return null;
  save.achievements.push(id);
  persist();
  return a;
}

const today = () => new Date().toISOString().slice(0, 10);

export interface Award {
  gained: number;
  lines: [string, number][];
  before: number;
  after: number;
  levelUp: boolean;
  newCelebrations: string[];
  streak: number;
}

/** Add a finished match's XP, including the first-match-of-the-day streak bonus. */
export function award(lines: [string, number][]): Award {
  const before = save.xp;
  const day = today();
  const out = lines.filter(([, n]) => n > 0);
  if (save.streak.last !== day) {
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    save.streak.days = save.streak.last === y ? save.streak.days + 1 : 1;
    save.streak.last = day;
    out.push([`Daily streak · day ${save.streak.days}`, Math.min(100, 20 * save.streak.days)]);
  }
  const gained = out.reduce((a, [, n]) => a + n, 0);
  save.xp += gained;
  persist();
  const lb = levelOf(before);
  const la = levelOf(save.xp);
  return {
    gained,
    lines: out,
    before,
    after: save.xp,
    levelUp: la > lb,
    newCelebrations: celebrations.filter((c) => c.level > lb && c.level <= la).map((c) => c.name),
    streak: save.streak.days,
  };
}
