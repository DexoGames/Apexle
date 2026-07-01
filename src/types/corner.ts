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

/** One point of the top-down corner shape (metres, centred on the apex). */
export interface ShapePoint {
  x: number;
  y: number;
}

/** A single corner: its anonymised trace + all comparison attributes. */
export interface Corner {
  id: string; // "monaco-T1"
  circuitId: string; // "monaco"
  number: number; // 1
  name: string | null; // "Sainte Devote" (only curated for famous corners)
  trace: TracePoint[];
  /**
   * Anonymised top-down racing line through the corner (metres, centred on the
   * apex), for the rookie difficulty's zoomed-in corner mini-map. Optional so
   * older data bundles without it degrade gracefully.
   */
  shape?: ShapePoint[];

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
  /** metres from the trace start to the apex (min-speed point), for the chart marker */
  apexD: number;
  notable: boolean; // a "well-known" corner — weighted up in the daily pick
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

// Legend is disabled for now — keep the type and config so it can be re-enabled easily.
export const DIFFICULTIES: Difficulty[] = ["rookie", "pro"];

export interface DifficultyConfig {
  label: string;
  blurb: string;
  /** max guesses */
  guesses: number;
  /** which telemetry channels are drawn in the trace */
  channels: TraceChannel[];
  /** show the "same circuit" hint (green edge) on each guess */
  showCircuitHint: boolean;
  /** show the zoomed-in top-down corner mini-map above the guess box */
  showCornerMap: boolean;
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
 *    showCornerMap   — zoomed-in top-down mini-map of the corner shape (a strong
 *                      visual hint; on for rookie to make it much easier)
 *    label / blurb   — shown in the UI and the How-to-play modal
 *
 *  (Which attributes are compared at all, and their base thresholds, live in
 *   src/game/attributes.ts.) Every mode requires the exact corner to win.
 */
export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  rookie: {
    label: "Rookie",
    blurb: "Corner map + full telemetry, forgiving matches, 5 guesses.",
    guesses: 5,
    channels: ["speed", "throttle", "brake"],
    showCircuitHint: true,
    showCornerMap: true,
    tolerance: 1.6,
  },
  pro: {
    label: "Pro",
    blurb: "Full telemetry shown, 5 guesses.",
    guesses: 5,
    channels: ["speed", "throttle", "brake"],
    showCircuitHint: true,
    showCornerMap: false,
    tolerance: 1,
  },
  legend: {
    label: "Legend",
    blurb: "Throttle and braking trace only, no circuit hint, 4 guesses.",
    guesses: 4,
    channels: ["throttle", "brake"],
    showCircuitHint: false,
    showCornerMap: false,
    tolerance: 1,
  },
};
