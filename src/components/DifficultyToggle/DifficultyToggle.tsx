import type { Difficulty } from "../../types/corner";
import { DIFFICULTIES, DIFFICULTY_CONFIG } from "../../types/corner";
import { cx } from "../../lib/cx";
import styles from "./DifficultyToggle.module.css";

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

export function DifficultyToggle({ value, onChange }: Props) {
  return (
    <div className={styles.group} role="tablist" aria-label="Difficulty">
      {DIFFICULTIES.map((d) => (
        <button
          key={d}
          role="tab"
          aria-selected={value === d}
          className={cx(styles.btn, value === d && styles.active)}
          onClick={() => onChange(d)}
          title={DIFFICULTY_CONFIG[d].blurb}
        >
          {DIFFICULTY_CONFIG[d].label}
        </button>
      ))}
    </div>
  );
}
