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
  /** win on matching just the circuit (true) or the exact corner (false) */
  circuitOnly: boolean;
  /** show the "same circuit" hint on each guess */
  showCircuitHint: boolean;
}

export type TraceChannel = "speed" | "throttle" | "brake";

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  rookie: {
    label: "Rookie",
    blurb: "Name the circuit — any corner on it counts. Full inputs, generous matches.",
    guesses: 6,
    channels: ["speed", "throttle", "brake"],
    circuitOnly: true,
    showCircuitHint: true,
  },
  pro: {
    label: "Pro",
    blurb: "Pin the exact corner. Speed & brake trace.",
    guesses: 6,
    channels: ["speed", "brake"],
    circuitOnly: false,
    showCircuitHint: true,
  },
  legend: {
    label: "Legend",
    blurb: "Exact corner. Speed trace only, tight tolerances, 4 guesses.",
    guesses: 4,
    channels: ["speed"],
    circuitOnly: false,
    showCircuitHint: false,
  },
};
