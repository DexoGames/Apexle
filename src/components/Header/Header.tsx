import styles from "./Header.module.css";

interface HeaderProps {
  onHowTo?: () => void;
  onStats?: () => void;
}

/** Fixed top bar in the dexo.games style: status + APEXLE wordmark + icon actions. */
export function Header({ onHowTo, onStats }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.status}>
          <span className={styles.dot} />
          Daily
        </span>
        <span className={styles.brand}>
          Apex<span className={styles.brandAccent}>le</span>
        </span>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onHowTo}
          aria-label="How to play"
          title="How to play"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1-1.5 2.1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="17.5" r="1.2" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onStats}
          aria-label="Statistics"
          title="Statistics"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <rect x="3" y="12" width="4" height="8" fill="currentColor" />
            <rect x="10" y="7" width="4" height="13" fill="currentColor" />
            <rect x="17" y="3" width="4" height="17" fill="currentColor" />
          </svg>
        </button>
        <a
          className={styles.homeLink}
          href="https://www.dexo.games"
          target="_blank"
          rel="noopener noreferrer"
        >
          dexo.games&nbsp;&#8599;
        </a>
      </div>
    </header>
  );
}
