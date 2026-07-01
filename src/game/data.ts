import cornersJson from "../data/corners.json";
import circuitsJson from "../data/circuits.json";
import type { Circuit, Corner, Difficulty } from "../types/corner";
import { seededRandom, puzzleNumber } from "../lib/rng";

export const CORNERS = cornersJson as unknown as Corner[];
export const CIRCUITS = circuitsJson as unknown as Circuit[];

const circuitMap = new Map(CIRCUITS.map((c) => [c.id, c]));
const cornerMap = new Map(CORNERS.map((c) => [c.id, c]));

export function getCorner(id: string): Corner {
  const c = cornerMap.get(id);
  if (!c) throw new Error(`unknown corner: ${id}`);
  return c;
}

export function circuitName(id: string): string {
  return circuitMap.get(id)?.name ?? id;
}

/** Abbreviated circuit name for compact UI (dropdown, grid). */
export function circuitShort(id: string): string {
  const c = circuitMap.get(id);
  return c?.short || c?.name || id;
}

/** A corner's display label: its name if it has one, else "T<n>". */
export function cornerPrimary(corner: { name: string | null; number: number }): string {
  return corner.name ?? `T${corner.number}`;
}

/** The subtle turn code shown beside a named corner (null when unnamed). */
export function cornerCode(corner: { name: string | null; number: number }): string | null {
  return corner.name ? `T${corner.number}` : null;
}

export interface CornerOption {
  id: string;
  circuitId: string;
  circuitShort: string;
  number: number;
  name: string | null;
  primary: string;
  code: string | null;
  /** lowercased haystack for the search box (full + short names, corner name, T#) */
  search: string;
}

/** Flat, pre-labelled list backing the guess search box. */
export const CORNER_OPTIONS: CornerOption[] = CORNERS.map((c) => {
  const short = circuitShort(c.circuitId);
  return {
    id: c.id,
    circuitId: c.circuitId,
    circuitShort: short,
    number: c.number,
    name: c.name,
    primary: cornerPrimary(c),
    code: cornerCode(c),
    search: `${circuitName(c.circuitId)} ${short} ${c.name ?? ""} t${c.number}`.toLowerCase(),
  };
}).sort((a, b) =>
  a.circuitShort.localeCompare(b.circuitShort) || a.number - b.number,
);

export const HAS_DATA = CORNERS.length > 0;

// --- daily selection --------------------------------------------------------
// A fixed, deterministic 365-day sequence per difficulty (repeats every year).
// ~75% of days draw from the "well-known" (notable) corners, the rest from the
// others. Everyone sees the same corner each day with no server needed.
const DAILY_CYCLE = 365;
const NOTABLE_BIAS = 0.75;

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Flat kinks with no braking and negligible angle change are unrecognisable from
// telemetry alone — exclude them from the answer pool unless they're notable
// (e.g. Eau Rouge is notable and stays; a random Jeddah kink doesn't).
const isBoringKink = (c: Corner) => c.brakingDistance === 0 && c.cornerAngle < 20;

const sequences = new Map<Difficulty, Corner[]>();

function dailySequence(difficulty: Difficulty): Corner[] {
  const cached = sequences.get(difficulty);
  if (cached) return cached;

  const rng = seededRandom(`apexle-daily-v1|${difficulty}`);
  const notable = shuffle(CORNERS.filter((c) => c.notable), rng);
  const others = shuffle(CORNERS.filter((c) => !c.notable && !isBoringKink(c)), rng);

  const seq: Corner[] = [];
  let ni = 0;
  let oi = 0;
  for (let i = 0; i < DAILY_CYCLE; i++) {
    // draw from the notable pool ~NOTABLE_BIAS of the time (cycling each shuffled
    // pool so corners don't repeat until the pool is exhausted)
    const pickNotable =
      notable.length > 0 && (others.length === 0 || rng() < NOTABLE_BIAS);
    if (pickNotable) {
      seq.push(notable[ni % notable.length]);
      ni++;
    } else {
      seq.push(others[oi % others.length]);
      oi++;
    }
  }
  sequences.set(difficulty, seq);
  return seq;
}

/** The deterministic daily corner for a difficulty (same for everyone, no server). */
export function dailyCorner(difficulty: Difficulty, date = new Date()): Corner {
  const seq = dailySequence(difficulty);
  const n = seq.length;
  const idx = (((puzzleNumber(date) - 1) % n) + n) % n;
  return seq[idx];
}

export function randomCorner(excludeId?: string): Corner {
  if (CORNERS.length === 1) return CORNERS[0];
  let c = CORNERS[Math.floor(Math.random() * CORNERS.length)];
  while (excludeId && c.id === excludeId) {
    c = CORNERS[Math.floor(Math.random() * CORNERS.length)];
  }
  return c;
}
