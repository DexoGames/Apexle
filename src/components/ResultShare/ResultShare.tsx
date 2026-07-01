import { useState } from "react";
import type { Corner, Difficulty } from "../../types/corner";
import type { GuessResult } from "../../lib/compare";
import { buildShare, copyToClipboard } from "../../lib/share";
import { circuitShort } from "../../game/data";
import { cx } from "../../lib/cx";
import { Button } from "../Button/Button";
import styles from "./ResultShare.module.css";

interface Props {
  status: "won" | "lost";
  answer: Corner;
  results: GuessResult[];
  difficulty: Difficulty;
  puzzleNumber: number;
  isDaily: boolean;
  onPractice: () => void;
  /** best green count and total, for the score bar */
  bestGreens: number;
  totalAttrs: number;
}

export function ResultShare({
  status,
  answer,
  results,
  difficulty,
  puzzleNumber,
  isDaily,
  onPractice,
  bestGreens,
  totalAttrs,
}: Props) {
  const [copied, setCopied] = useState(false);
  const won = status === "won";
  const pct = totalAttrs > 0 ? Math.round((bestGreens / totalAttrs) * 100) : 0;

  const share = async () => {
    const text = buildShare(results, difficulty, puzzleNumber, won);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className={cx(styles.box, won ? styles.won : styles.lost)}>
      <div className={styles.headline}>{won ? "Nailed it!" : "Out of laps"}</div>
      <p className={styles.reveal}>
        It was <b>{circuitShort(answer.circuitId)}</b>,{" "}
        {answer.name ?? `Turn ${answer.number}`}
        {answer.name ? ` (T${answer.number})` : ""}.
      </p>

      {/* score bar */}
      <div className={styles.scoreWrap}>
        <div className={styles.scoreLabel}>
          {won
            ? "All attributes matched"
            : `Best guess: ${bestGreens} / ${totalAttrs} attributes`}
        </div>
        <div className={styles.scoreTrack}>
          <div
            className={cx(styles.scoreBar, won ? styles.scoreBarWon : styles.scoreBarLost)}
            style={{ width: won ? "100%" : `${pct}%` }}
          />
        </div>
      </div>

      <div className={styles.facts}>
        <span>{answer.minSpeed} km/h min</span>
        <span>{answer.brakingDistance} m braking</span>
        <span>
          {answer.cornerAngle}° {answer.direction === "L" ? "left" : "right"}
        </span>
        <span>gear {answer.minGear}</span>
      </div>

      <div className={styles.actions}>
        {isDaily && (
          <Button variant="primary" onClick={share}>
            {copied ? "Copied!" : "Share result"}
          </Button>
        )}
        <Button variant="secondary" onClick={onPractice}>
          Practice another
        </Button>
      </div>
      {!isDaily && (
        <p className={styles.practiceNote}>Practice round, not counted in your streak.</p>
      )}
    </div>
  );
}
