/** One sample of the anonymised display trace (distance normalised to start at 0). */
export interface TracePoint {
  /** metres from the start of the shown window */
  d: number;
  /** km/h */
  speed: number;
  /** 0–100 */
  throttle: number;
  /** 0 = off, 1 = on */
  brake: 0 | 1;
}

/** A single corner: its anonymised trace + all comparison attributes. */
export interface Corner {
  id: string; // "monaco-T1"
  circuitId: string; // "monaco"
  number: number; // 1
  name: string | null; // "Sainte Devote" (only curated for famous corners)
  trace: TracePoint[];

  // --- comparison attributes (the pipeline always stores all of them) ---
  minSpeed: number; // km/h
  entrySpeed: number; // km/h
  brakingDistance: number; // m
  cornerAngle: number; // degrees of direction change
  minGear: number;
  gradient: number; // signed % (approximate)
  direction: "L" | "R";
  sector: number; // 1, 2 or 3
  lateralG: number; // peak g
  drsApproach: boolean;
  duration: number; // s
}

export interface Circuit {
  id: string;
  name: string;
  /** abbreviated name for compact UI (dropdown, grid) */
  short: string;
  country: string;
  corners: number;
}

export type Difficulty = "rookie" | "pro" | "legend";

export const DIFFICULTIES: Difficulty[] = ["rookie", "pro", "legend"];

export interface DifficultyConfig {
  label: string;
  blurb: string;
  /** max guesses */
  guesses: number;
  /** which telemetry channels are drawn in the trace */
  channels: TraceChannel[];
  /** show the "same circuit" hint (green edge) on each guess */
  showCircuitHint: boolean;
  /**
   * Multiplier on every attribute's match thresholds. >1 = more forgiving
   * (bigger green/yellow bands), <1 = stricter. The base thresholds per
   * attribute live in src/game/attributes.ts (exactWithin / closeWithin).
   */
  tolerance: number;
}

export type TraceChannel = "speed" | "throttle" | "brake";

/**
 * ============================================================================
 *  DIFFICULTY CONTROL PANEL — edit this object to tune the tiers.
 * ============================================================================
 *  Every difference between difficulties is here:
 *    channels        — which traces are drawn (add "brake"/"throttle" to a tier
 *                       to show them, e.g. give Legend braking data)
 *    guesses         — number of attempts
 *    tolerance       — how forgiving the colour matches are (1 = normal)
 *    showCircuitHint — green edge when the guess is on the right circuit
 *    label / blurb   — shown in the UI and the How-to-play modal
 *
 *  (Which attributes are compared at all, and their base thresholds, live in
 *   src/game/attributes.ts.) Every mode requires the exact corner to win.
 */
export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  rookie: {
    label: "Rookie",
    blurb: "Full telemetry shown, 6 guesses.",
    guesses: 6,
    channels: ["speed", "throttle", "brake"],
    showCircuitHint: true,
    tolerance: 1,
  },
  pro: {
    label: "Pro",
    blurb: "Full telemetry shown, 4 guesses.",
    guesses: 4,
    channels: ["speed", "throttle", "brake"],
    showCircuitHint: true,
    tolerance: 1,
  },
  legend: {
    label: "Legend",
    blurb: "Throttle and braking trace only, no circuit hint, 4 guesses.",
    guesses: 4,
    channels: ["throttle", "brake"],
    showCircuitHint: false,
    tolerance: 1,
  },
};
