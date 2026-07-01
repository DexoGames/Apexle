import { Modal } from "../Modal/Modal";
import { enabledAttributes } from "../../game/attributes";
import { DIFFICULTIES, DIFFICULTY_CONFIG } from "../../types/corner";
import styles from "./HowToPlayModal.module.css";

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <p className={styles.lead}>
        You're given the telemetry for a single corner somewhere on the F1 calendar.
        The trace is stripped of all context — no circuit name, no labels, nothing
        that names it outright. Just the data (plus, on Rookie, the corner's bare
        shape). Figure out which corner it is.
      </p>

      <p className={styles.p}>
        Pick a corner from the search box. Each guess gets scored against the hidden
        answer across its telemetry attributes:
      </p>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <i className={styles.swExact} /> spot on
        </span>
        <span className={styles.legendItem}>
          <i className={styles.swClose} /> close
        </span>
        <span className={styles.legendItem}>
          <i className={styles.swFar} /> way off
        </span>
        <span className={styles.legendItem}>
          <b className={styles.arrow}>▲ / ▼</b> answer is higher / lower
        </span>
      </div>

      <p className={styles.p}>
        A green bar on the left side of a guess means you're on the right circuit.
      </p>

      <h3 className={styles.h}>What gets compared</h3>
      <ul className={styles.attrs}>
        {enabledAttributes().map((a) => (
          <li key={a.key}>
            <b>{a.short}</b> — {a.label.toLowerCase()}
          </li>
        ))}
      </ul>

      <h3 className={styles.h}>Difficulty</h3>
      <ul className={styles.diffs}>
        {DIFFICULTIES.map((d) => (
          <li key={d}>
            <b>{DIFFICULTY_CONFIG[d].label}</b> — {DIFFICULTY_CONFIG[d].blurb}
          </li>
        ))}
      </ul>

      <p className={styles.note}>
        One daily puzzle per difficulty, and everyone gets the same one. Practice
        mode is unlimited and does not count toward your streak.
      </p>
    </Modal>
  );
}
