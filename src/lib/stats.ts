import type { Difficulty } from "../types/corner";
import { load, save } from "./storage";

export interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  /** guesses-taken -> count (winning games only) */
  dist: Record<number, number>;
}

const EMPTY: Stats = { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, dist: {} };

const statsKey = (d: Difficulty) => `stats:${d}`;

export function readStats(difficulty: Difficulty): Stats {
  return load<Stats>(statsKey(difficulty), { ...EMPTY, dist: {} });
}

/** Record a finished DAILY game and notify subscribers. Per-difficulty streaks. */
export function recordResult(
  difficulty: Difficulty,
  won: boolean,
  guesses: number,
): Stats {
  const s = readStats(difficulty);
  s.played += 1;
  if (won) {
    s.wins += 1;
    s.currentStreak += 1;
    s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
    s.dist[guesses] = (s.dist[guesses] ?? 0) + 1;
  } else {
    s.currentStreak = 0;
  }
  save(statsKey(difficulty), s);
  emit();
  return s;
}

// --- tiny pub/sub so the stats modal stays in sync without prop drilling ---
const listeners = new Set<() => void>();
export function subscribeStats(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  listeners.forEach((fn) => fn());
}
