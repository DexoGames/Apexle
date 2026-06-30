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
}

export type TraceChannel = "speed" | "throttle" | "brake";

// Every mode requires the exact corner to win. Difficulty changes how much you're
// shown (channels), how forgiving the matches are, and how many guesses you get.
export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  rookie: {
    label: "Rookie",
    blurb: "Full inputs shown, generous tolerances, same-circuit hints, 6 guesses.",
    guesses: 6,
    channels: ["speed", "throttle", "brake"],
    showCircuitHint: true,
  },
  pro: {
    label: "Pro",
    blurb: "Speed & brake trace, standard tolerances, 6 guesses.",
    guesses: 6,
    channels: ["speed", "brake"],
    showCircuitHint: true,
  },
  legend: {
    label: "Legend",
    blurb: "Speed trace only, tight tolerances, no circuit hint, 4 guesses.",
    guesses: 4,
    channels: ["speed"],
    showCircuitHint: false,
  },
};
