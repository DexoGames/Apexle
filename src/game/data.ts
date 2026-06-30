import cornersJson from "../data/corners.json";
import circuitsJson from "../data/circuits.json";
import type { Circuit, Corner, Difficulty } from "../types/corner";
import { seededRandom, ymd } from "../lib/rng";

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

/** The deterministic daily corner for a difficulty (same for everyone, no server). */
export function dailyCorner(difficulty: Difficulty, date = new Date()): Corner {
  const rng = seededRandom(`${ymd(date)}|${difficulty}`);
  return CORNERS[Math.floor(rng() * CORNERS.length)];
}

export function randomCorner(excludeId?: string): Corner {
  if (CORNERS.length === 1) return CORNERS[0];
  let c = CORNERS[Math.floor(Math.random() * CORNERS.length)];
  while (excludeId && c.id === excludeId) {
    c = CORNERS[Math.floor(Math.random() * CORNERS.length)];
  }
  return c;
}
