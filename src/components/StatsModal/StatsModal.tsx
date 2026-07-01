import { useState, type ReactNode } from "react";
import { useStats } from "../../game/useStats";
import type { Corner, Difficulty } from "../../types/corner";
import { DIFFICULTY_CONFIG } from "../../types/corner";
import type { GuessResult } from "../../lib/compare";
import { buildShare, copyToClipboard } from "../../lib/share";
import { circuitShort } from "../../game/data";
import { cx } from "../../lib/cx";
import { Modal } from "../Modal/Modal";
import { Button } from "../Button/Button";
import styles from "./StatsModal.module.css";

export interface ResultInfo {
  status: "won" | "lost";
  answer: Corner;
  results: GuessResult[];
  puzzleNumber: number;
  isDaily: boolean;
  bestGreens: number;
  totalAttrs: number;
}

interface Props {
  difficulty: Difficulty;
  onClose: () => void;
  /** when set, shows the finished-game result (corner reveal + share) up top */
  result?: ResultInfo;
}

export function StatsModal({ difficulty, onClose, result }: Props) {
  const s = useStats(difficulty);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const winPct = s.played ? Math.round((s.wins / s.played) * 100) : 0;
  const counts = Array.from({ length: cfg.guesses }, (_, i) => s.dist[i + 1] ?? 0);
  const maxBar = Math.max(1, ...counts);

  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (!result) return;
    const text = buildShare(
      result.results,
      difficulty,
      result.puzzleNumber,
      result.status === "won",
    );
    if (await copyToClipboard(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <Modal title={`Stats — ${cfg.label}`} onClose={onClose}>
      {result && (
        <div
          className={cx(styles.result, result.status === "won" ? styles.won : styles.lost)}
        >
          <div className={styles.headline}>
            {result.status === "won" ? "Nailed it" : "Out of laps"}
          </div>
          <p className={styles.reveal}>
            It was <b>{circuitShort(result.answer.circuitId)}</b>,{" "}
            {result.answer.name ?? `Turn ${result.answer.number}`}
            {result.answer.name ? ` (T${result.answer.number})` : ""}.
          </p>
          <div className={styles.scoreWrap}>
            <div className={styles.scoreLabel}>
              {result.status === "won"
                ? "All attributes matched"
                : `Best guess: ${result.bestGreens} / ${result.totalAttrs} attributes`}
            </div>
            <div className={styles.scoreTrack}>
              <div
                className={cx(
                  styles.scoreBar,
                  result.status === "won" ? styles.scoreBarWon : styles.scoreBarLost,
                )}
                style={{
                  width:
                    result.status === "won"
                      ? "100%"
                      : `${Math.round((result.bestGreens / result.totalAttrs) * 100)}%`,
                }}
              />
            </div>
          </div>
          {result.isDaily && (
            <Button variant="primary" className={styles.shareBtn} onClick={share}>
              {copied ? "Copied!" : "Share result"}
            </Button>
          )}
        </div>
      )}

      <div className={styles.row}>
        <Stat n={s.played} label="Played" />
        <Stat n={`${winPct}%`} label="Win" />
        <Stat n={s.currentStreak} label="Streak" />
        <Stat n={s.maxStreak} label="Max" />
      </div>

      <h3 className={styles.h}>Guess distribution</h3>
      {s.wins === 0 ? (
        <p className={styles.empty}>No wins yet. Go get one.</p>
      ) : (
        <div className={styles.dist}>
          {counts.map((c, i) => (
            <div key={i} className={styles.distRow}>
              <span className={styles.distN}>{i + 1}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.bar}
                  style={{ width: `${Math.max((c / maxBar) * 100, c > 0 ? 12 : 0)}%` }}
                >
                  {c > 0 && <span>{c}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className={styles.note}>Daily results only. Streaks are tracked per difficulty.</p>
    </Modal>
  );
}

function Stat({ n, label }: { n: ReactNode; label: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statN}>{n}</div>
      <div className={styles.statL}>{label}</div>
    </div>
  );
}
