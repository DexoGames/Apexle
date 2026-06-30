import type { Corner, Difficulty } from "../types/corner";
import { enabledAttributes, type ComparableKey } from "../game/attributes";

export type CellStatus = "exact" | "close" | "far";
export type Arrow = "up" | "down" | null;

export interface Cell {
  key: ComparableKey;
  short: string;
  label: string;
  status: CellStatus;
  /** for numeric attrs: which way the ANSWER lies vs the guess */
  arrow: Arrow;
  /** the guess's own value, formatted */
  display: string;
}

export interface GuessResult {
  corner: Corner;
  /** satisfies the win condition for this difficulty */
  correct: boolean;
  sameCircuit: boolean;
  cells: Cell[];
}

/** Score one guessed corner against the hidden answer, per the enabled attributes. */
export function compareGuess(
  guess: Corner,
  answer: Corner,
  difficulty: Difficulty,
): GuessResult {
  const cells: Cell[] = enabledAttributes().map((def) => {
    const g = guess[def.key];
    const a = answer[def.key];

    if (def.type === "categorical") {
      return {
        key: def.key,
        short: def.short,
        label: def.label,
        status: g === a ? "exact" : "far",
        arrow: null,
        display: def.format(g as number | string | boolean),
      };
    }

    const gv = Number(g);
    const av = Number(a);
    const diff = Math.abs(av - gv);
    const scale = def.difficultyScale?.[difficulty] ?? 1;
    const exact = (def.exactWithin ?? 0) * scale;
    const close = (def.closeWithin ?? 0) * scale;

    let status: CellStatus = "far";
    if (diff <= exact) status = "exact";
    else if (diff <= close) status = "close";

    const arrow: Arrow = av > gv ? "up" : av < gv ? "down" : null;

    return {
      key: def.key,
      short: def.short,
      label: def.label,
      status,
      arrow,
      display: def.format(g as number | string | boolean),
    };
  });

  const sameCircuit = guess.circuitId === answer.circuitId;
  // Win only on the exact corner, in every difficulty.
  const correct = guess.id === answer.id;

  return { corner: guess, correct, sameCircuit, cells };
}
