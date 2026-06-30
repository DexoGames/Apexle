import type { ReactNode } from "react";
import { useStats } from "../../game/useStats";
import type { Difficulty } from "../../types/corner";
import { DIFFICULTY_CONFIG } from "../../types/corner";
import { Modal } from "../Modal/Modal";
import styles from "./StatsModal.module.css";

interface Props {
  difficulty: Difficulty;
  onClose: () => void;
}

export function StatsModal({ difficulty, onClose }: Props) {
  const s = useStats(difficulty);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const winPct = s.played ? Math.round((s.wins / s.played) * 100) : 0;
  const counts = Array.from({ length: cfg.guesses }, (_, i) => s.dist[i + 1] ?? 0);
  const maxBar = Math.max(1, ...counts);

  return (
    <Modal title={`Stats — ${cfg.label}`} onClose={onClose}>
      <div className={styles.row}>
        <Stat n={s.played} label="Played" />
        <Stat n={`${winPct}%`} label="Win" />
        <Stat n={s.currentStreak} label="Streak" />
        <Stat n={s.maxStreak} label="Max" />
      </div>

      <h3 className={styles.h}>Guess distribution</h3>
      {s.wins === 0 ? (
        <p className={styles.empty}>No wins logged yet — go get one.</p>
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
