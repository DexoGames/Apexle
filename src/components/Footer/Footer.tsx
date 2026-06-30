import styles from "./Footer.module.css";

/** Slim footer: data credit, fan-project disclaimer, link back to dexo.games. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.disclaimer}>
          Unofficial fan project. Not affiliated with Formula 1, the FIA, or any
          team. Telemetry sourced via{" "}
          <a
            href="https://github.com/theOehrly/Fast-F1"
            target="_blank"
            rel="noopener noreferrer"
          >
            FastF1
          </a>{" "}
          for personal, non-commercial use.
        </p>
        <p className={styles.meta}>
          <a href="https://www.dexo.games" target="_blank" rel="noopener noreferrer">
            dexo.games
          </a>
          <span className={styles.sep}>//</span>
          &copy; {new Date().getFullYear()} Dexter Smith
        </p>
      </div>
    </footer>
  );
}
