import { Fragment } from "react";
import { enabledAttributes } from "../../game/attributes";
import type { Arrow, GuessResult } from "../../lib/compare";
import { circuitName } from "../../game/data";
import { cx } from "../../lib/cx";
import styles from "./ComparisonGrid.module.css";

interface Props {
  results: GuessResult[];
  maxGuesses: number;
  showCircuitHint: boolean;
}

const ARROW: Record<Exclude<Arrow, null>, string> = { up: "▲", down: "▼" };

/**
 * One row per guess. Each attribute cell is coloured by closeness (green/yellow/
 * grey) and numeric cells carry a ▲/▼ telling you which way the answer lies.
 * Columns are derived from enabledAttributes(), so the registry drives this.
 */
export function ComparisonGrid({ results, maxGuesses, showCircuitHint }: Props) {
  const attrs = enabledAttributes();
  const cols = `minmax(120px, 1.4fr) repeat(${attrs.length}, minmax(60px, 1fr))`;
  const emptyRows = Math.max(0, maxGuesses - results.length);

  return (
    <div className={styles.scroll}>
      <div className={styles.grid} style={{ gridTemplateColumns: cols }}>
        {/* header */}
        <div className={cx(styles.head, styles.cornerHead)}>Corner</div>
        {attrs.map((a) => (
          <div key={a.key} className={styles.head} title={`${a.label}${a.unit ? ` (${a.unit})` : ""}`}>
            {a.short}
          </div>
        ))}

        {/* guesses */}
        {results.map((r, ri) => (
          <Fragment key={ri}>
            <div
              className={cx(
                styles.cornerCell,
                showCircuitHint && r.sameCircuit && styles.sameCircuit,
              )}
            >
              <span className={styles.cName}>{circuitName(r.corner.circuitId)}</span>
              <span className={styles.cTurn}>T{r.corner.number}</span>
            </div>
            {r.cells.map((c) => (
              <div key={c.key} className={cx(styles.cell, styles[c.status])}>
                <span className={styles.val}>{c.display}</span>
                {c.arrow && <span className={styles.arrow}>{ARROW[c.arrow]}</span>}
              </div>
            ))}
          </Fragment>
        ))}

        {/* remaining slots */}
        {Array.from({ length: emptyRows }).map((_, i) => (
          <Fragment key={`e${i}`}>
            <div className={cx(styles.cornerCell, styles.empty)} />
            {attrs.map((a) => (
              <div key={a.key} className={cx(styles.cell, styles.empty)} />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
