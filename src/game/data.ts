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

export interface CornerOption {
  id: string;
  label: string;
  circuitId: string;
  circuitName: string;
  number: number;
  name: string | null;
}

/** Flat, pre-labelled list backing the guess search box. */
export const CORNER_OPTIONS: CornerOption[] = CORNERS.map((c) => ({
  id: c.id,
  circuitId: c.circuitId,
  number: c.number,
  name: c.name,
  circuitName: circuitName(c.circuitId),
  label: `${circuitName(c.circuitId)} — T${c.number}${c.name ? ` ${c.name}` : ""}`,
})).sort((a, b) => a.label.localeCompare(b.label));

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
