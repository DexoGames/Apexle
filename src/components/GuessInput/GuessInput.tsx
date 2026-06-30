import { useMemo, useState } from "react";
import { CORNER_OPTIONS, type CornerOption } from "../../game/data";
import { cx } from "../../lib/cx";
import styles from "./GuessInput.module.css";

interface Props {
  onGuess: (id: string) => void;
  guessedIds: string[];
  disabled?: boolean;
}

const MAX_RESULTS = 8;

export function GuessInput({ onGuess, guessedIds, disabled }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);

  const guessed = useMemo(() => new Set(guessedIds), [guessedIds]);

  const matches = useMemo(() => {
    const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return CORNER_OPTIONS.filter((o) => tokens.every((t) => o.search.includes(t))).slice(
      0,
      MAX_RESULTS,
    );
  }, [q]);

  const choose = (o: CornerOption) => {
    if (guessed.has(o.id)) return;
    onGuess(o.id);
    setQ("");
    setOpen(false);
    setHi(0);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const m = matches[hi];
      if (m) choose(m);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <input
        className={styles.input}
        value={q}
        disabled={disabled}
        placeholder={disabled ? "Round over" : "Guess a corner — type a circuit name…"}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKey}
        aria-label="Guess a corner"
        autoComplete="off"
      />
      {open && matches.length > 0 && (
        <ul className={styles.list}>
          {matches.map((o, i) => {
            const used = guessed.has(o.id);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  className={cx(styles.opt, i === hi && styles.optHi, used && styles.optUsed)}
                  onMouseEnter={() => setHi(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  disabled={used}
                >
                  <span className={styles.optCircuit}>{o.circuitShort}</span>
                  <span className={styles.optTurn}>{o.primary}</span>
                  {o.code && <span className={styles.optCode}>{o.code}</span>}
                  {used && <span className={styles.optTag}>guessed</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
