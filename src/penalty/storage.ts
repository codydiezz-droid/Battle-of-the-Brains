import type { Difficulty } from "./ai";

/** Settings and personal records, kept in this browser only. */
export interface Save {
  difficulty: Difficulty;
  muted: boolean;
  tutorial: { shoot: boolean; keep: boolean };
  shooterId: string;
  keeperId: string;
  best: {
    challenge: Record<Difficulty, number>;
    keeper: Record<Difficulty, number>;
  };
  shootout: { wins: number; losses: number };
  totals: { shots: number; goals: number; faced: number; saves: number; perfect: number };
}

const KEY = "onebridge-penalty-club-v2";

const fresh = (): Save => ({
  difficulty: "medium",
  muted: false,
  tutorial: { shoot: false, keep: false },
  shooterId: "cody",
  keeperId: "jade",
  best: { challenge: { easy: 0, medium: 0, hard: 0 }, keeper: { easy: 0, medium: 0, hard: 0 } },
  shootout: { wins: 0, losses: 0 },
  totals: { shots: 0, goals: 0, faced: 0, saves: 0, perfect: 0 },
});

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw);
    const base = fresh();
    return {
      ...base,
      ...data,
      tutorial: { ...base.tutorial, ...data.tutorial },
      best: {
        challenge: { ...base.best.challenge, ...data.best?.challenge },
        keeper: { ...base.best.keeper, ...data.best?.keeper },
      },
      shootout: { ...base.shootout, ...data.shootout },
      totals: { ...base.totals, ...data.totals },
    };
  } catch {
    return fresh();
  }
}

export const save: Save = load();

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage may be unavailable (private mode); the game still works */
  }
}
