import type { Corner } from "../types/corner";

/**
 * THE ATTRIBUTE REGISTRY — single source of truth.
 *
 * Every comparison attribute is declared once here. Enable/disable any of them by
 * flipping `enabled` — scoring (compare.ts), the comparison grid, and the share
 * output all read from `enabledAttributes()`, so no other code changes are needed.
 * The data pipeline always computes & stores ALL attributes, so re-enabling one
 * later never requires re-extracting telemetry.
 *
 * Reorder the array to reorder the grid columns.
 */

export type ComparableKey =
  | "minSpeed"
  | "entrySpeed"
  | "brakingDistance"
  | "cornerAngle"
  | "minGear"
  | "gradient"
  | "lateralG"
  | "duration"
  | "direction"
  | "drsApproach";

export type AttrType = "numeric" | "categorical";

export interface AttributeDef {
  key: ComparableKey;
  label: string; // full label (how-to / tooltips)
  short: string; // compact column header in the grid
  unit?: string;
  type: AttrType;
  /** THE SWITCH — flip to false to drop this attribute everywhere. */
  enabled: boolean;
  /** numeric: |answer − guess| ≤ this ⇒ green (exact-ish). Scaled by the
   *  difficulty's `tolerance` (see DIFFICULTY_CONFIG in types/corner.ts). */
  exactWithin?: number;
  /** numeric: |answer − guess| ≤ this ⇒ yellow (close). Also tolerance-scaled. */
  closeWithin?: number;
  /** display formatter for a cell value */
  format: (v: number | string | boolean) => string;
}

const sign = (v: number) => (v > 0 ? "+" : "");

export const ATTRIBUTES: AttributeDef[] = [
  {
    key: "minSpeed",
    label: "Minimum speed",
    short: "Min Spd",
    unit: "km/h",
    type: "numeric",
    enabled: true,
    exactWithin: 8,
    closeWithin: 25,    format: (v) => `${v} km/h`,
  },
  {
    key: "brakingDistance",
    label: "Braking distance",
    short: "Braking",
    unit: "m",
    type: "numeric",
    enabled: true,
    exactWithin: 15,
    closeWithin: 50,    format: (v) => `${v} m`,
  },
  {
    key: "cornerAngle",
    label: "Corner angle (tightness)",
    short: "Angle",
    unit: "°",
    type: "numeric",
    enabled: true,
    exactWithin: 10,
    closeWithin: 30,    format: (v) => `${v}°`,
  },
  {
    key: "gradient",
    label: "Gradient (approx.)",
    short: "Gradient",
    unit: "%",
    type: "numeric",
    enabled: true,
    exactWithin: 1,
    closeWithin: 3,    format: (v) => `${sign(Number(v))}${v}%`,
  },
  {
    key: "minGear",
    label: "Minimum gear",
    short: "Gear",
    type: "numeric",
    enabled: true,
    exactWithin: 0,
    closeWithin: 1,    format: (v) => `${v}`,
  },
  {
    key: "lateralG",
    label: "Peak lateral G",
    short: "Lat G",
    unit: "g",
    type: "numeric",
    enabled: false,
    exactWithin: 0.4,
    closeWithin: 1,    format: (v) => `${v}g`,
  },
  {
    key: "direction",
    label: "Corner direction",
    short: "Dir",
    type: "categorical",
    enabled: true,
    format: (v) => (v === "L" ? "LEFT" : "RIGHT"),
  },
  {
    key: "drsApproach",
    label: "DRS on approach",
    short: "DRS",
    type: "categorical",
    enabled: false,
    format: (v) => (v ? "DRS" : "NO DRS"),
  },
  // --- shipped off by default; flip enabled:true to add them ---
  {
    key: "entrySpeed",
    label: "Entry speed",
    short: "Entry",
    unit: "km/h",
    type: "numeric",
    enabled: false,
    exactWithin: 10,
    closeWithin: 30,    format: (v) => `${v} km/h`,
  },
  {
    key: "duration",
    label: "Corner duration",
    short: "Time",
    unit: "s",
    type: "numeric",
    enabled: false,
    exactWithin: 0.4,
    closeWithin: 1.2,    format: (v) => `${v}s`,
  },
];

/** The active attributes, in column order. Everything downstream reads this. */
export function enabledAttributes(): AttributeDef[] {
  return ATTRIBUTES.filter((a) => a.enabled);
}

export function attrValue(corner: Corner, key: ComparableKey): number | string | boolean {
  return corner[key] as number | string | boolean;
}
