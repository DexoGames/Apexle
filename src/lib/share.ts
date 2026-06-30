import type { Difficulty } from "../types/corner";
import { DIFFICULTY_CONFIG } from "../types/corner";
import type { GuessResult, CellStatus } from "./compare";

const EMOJI: Record<CellStatus, string> = {
  exact: "🟩",
  close: "🟨",
  far: "⬛",
};

/** Wordle-style shareable result: one emoji row per guess, colours only. */
export function buildShare(
  results: GuessResult[],
  difficulty: Difficulty,
  puzzleNumber: number,
  won: boolean,
): string {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const score = won ? `${results.length}/${cfg.guesses}` : `X/${cfg.guesses}`;
  const grid = results
    .map((r) => r.cells.map((c) => EMOJI[c.status]).join(""))
    .join("\n");
  return `Apexle #${puzzleNumber} ${cfg.label} ${score}\n${grid}\nhttps://apexle.dexo.games`;
}

/** Copy text to clipboard; resolves true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
