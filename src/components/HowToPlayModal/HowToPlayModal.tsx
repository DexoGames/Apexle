import { Modal } from "../Modal/Modal";
import { enabledAttributes } from "../../game/attributes";
import { DIFFICULTIES, DIFFICULTY_CONFIG } from "../../types/corner";
import styles from "./HowToPlayModal.module.css";

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <p className={styles.lead}>
        You're shown the anonymised telemetry for one Formula 1 corner — the speed
        trace, and (depending on difficulty) the throttle and braking. No track map,
        no labels. Work out which corner it is.
      </p>

      <p className={styles.p}>
        Guess any corner. Each guess is scored against the hidden answer across its
        telemetry attributes:
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

      <p className={styles.p}>A green left-edge on a guess means it's the right circuit.</p>

      <h3 className={styles.h}>Attributes compared</h3>
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
        One daily puzzle per difficulty, the same for everyone. Practice mode is
        unlimited and doesn't affect your streak.
      </p>
    </Modal>
  );
}
