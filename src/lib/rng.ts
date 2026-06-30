/**
 * Deterministic seeding so the daily puzzle is identical for everyone, with no
 * server. `xmur3` hashes a string seed; `mulberry32` turns it into a PRNG.
 */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seeded [0,1) generator from a string seed. */
export function seededRandom(seed: string): () => number {
  return mulberry32(xmur3(seed)());
}

// Launch day = puzzle #1. (Year, monthIndex, day) — month is 0-based, so 5 = June.
const EPOCH_UTC = Date.UTC(2026, 5, 30);

export function utcMidnight(date = new Date()): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Stable, ascending daily puzzle number (#1 on launch day). */
export function puzzleNumber(date = new Date()): number {
  return Math.floor((utcMidnight(date) - EPOCH_UTC) / 86400000) + 1;
}

/** UTC YYYY-MM-DD, used as the daily seed. */
export function ymd(date = new Date()): string {
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${date.getUTCFullYear()}-${m}-${d}`;
}
