import { useEffect, useState } from "react";
import { DIFFICULTY_CONFIG } from "./types/corner";
import { useGame } from "./game/useGame";
import { bestScore } from "./lib/compare";
import { HAS_DATA } from "./game/data";
import { load, save } from "./lib/storage";
import { cx } from "./lib/cx";

import { Header } from "./components/Header/Header";
import { Footer } from "./components/Footer/Footer";
import { TelemetryChart } from "./components/TelemetryChart/TelemetryChart";
import { CornerMap } from "./components/CornerMap/CornerMap";
import { GuessInput } from "./components/GuessInput/GuessInput";
import { ComparisonGrid } from "./components/ComparisonGrid/ComparisonGrid";
import { DifficultyToggle } from "./components/DifficultyToggle/DifficultyToggle";
import { ResultShare } from "./components/ResultShare/ResultShare";
import { StatsModal } from "./components/StatsModal/StatsModal";
import { HowToPlayModal } from "./components/HowToPlayModal/HowToPlayModal";

import styles from "./App.module.css";

export function App() {
  const game = useGame();
  const cfg = DIFFICULTY_CONFIG[game.difficulty];

  const score = bestScore(game.results);
  const bestRowIndex =
    game.status !== "playing" && !game.results.some((r) => r.correct)
      ? game.results.reduce(
          (best, r, i) => (r.greenCount > game.results[best].greenCount ? i : best),
          0,
        )
      : undefined;

  const [showStats, setShowStats] = useState(false);
  const [showHowTo, setShowHowTo] = useState(() => !load("seen:howto", false));

  // drive the difficulty-tinted accent colour via a root attribute (see globals.css)
  useEffect(() => {
    document.documentElement.dataset.difficulty = game.difficulty;
  }, [game.difficulty]);

  const closeHowTo = () => {
    setShowHowTo(false);
    save("seen:howto", true);
  };

  // surface the stats modal shortly after a daily game finishes
  useEffect(() => {
    if (game.isDaily && game.status !== "playing") {
      const t = setTimeout(() => setShowStats(true), 1100);
      return () => clearTimeout(t);
    }
  }, [game.status, game.isDaily]);

  if (!HAS_DATA) {
    return (
      <>
        <Header onHowTo={() => setShowHowTo(true)} onStats={() => setShowStats(true)} />
        <main className={styles.main}>
          <p className={styles.noData}>
            No telemetry bundled yet — run the data pipeline (see <code>data-pipeline/</code>).
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const playing = game.status === "playing";
  const showMap =
    cfg.showCornerMap && !!game.answer.shape && game.answer.shape.length > 1;

  return (
    <>
      <Header onHowTo={() => setShowHowTo(true)} onStats={() => setShowStats(true)} />

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <div className={styles.kicker}>
            {game.isDaily ? `Daily · #${game.puzzleNumber}` : "Practice"}
          </div>
          <h1 className={styles.title}>Guess the corner</h1>
        </div>

        <div className={styles.modeRow}>
          <div className={styles.modeGroup}>
            <button
              className={cx(styles.modeBtn, game.isDaily && styles.modeActive)}
              onClick={game.startDaily}
            >
              Daily
            </button>
            <button
              className={cx(styles.modeBtn, !game.isDaily && styles.modeActive)}
              onClick={game.startPractice}
            >
              Practice
            </button>
          </div>
          <DifficultyToggle value={game.difficulty} onChange={game.setDifficulty} />
        </div>

        <div className={cx(styles.puzzle, showMap && styles.puzzleSplit)}>
          <div className={styles.telemetryCell}>
            <TelemetryChart
              trace={game.answer.trace}
              channels={cfg.channels}
              direction={game.answer.direction}
              apexD={game.answer.apexD}
            />
          </div>
          {showMap && (
            <div className={styles.mapCell}>
              <CornerMap shape={game.answer.shape!} />
            </div>
          )}
        </div>

        <div className={styles.guessArea}>
          <GuessInput
            onGuess={game.submitGuess}
            guessedIds={game.guessedIds}
            disabled={!playing}
          />
          {playing && (
            <div className={styles.remaining}>
              {game.remaining} {game.remaining === 1 ? "guess" : "guesses"} left
            </div>
          )}
        </div>

        {game.results.length > 0 && (
          <ComparisonGrid
            results={game.results}
            maxGuesses={game.maxGuesses}
            showCircuitHint={cfg.showCircuitHint}
            bestRowIndex={bestRowIndex}
          />
        )}

        {!playing && (
          <ResultShare
            status={game.status === "won" ? "won" : "lost"}
            answer={game.answer}
            results={game.results}
            difficulty={game.difficulty}
            puzzleNumber={game.puzzleNumber}
            isDaily={game.isDaily}
            onPractice={game.startPractice}
            bestGreens={score.greens}
            totalAttrs={score.total}
          />
        )}
      </main>

      <Footer />

      {showHowTo && <HowToPlayModal onClose={closeHowTo} />}
      {showStats && (
        <StatsModal
          difficulty={game.difficulty}
          onClose={() => setShowStats(false)}
          result={
            game.status !== "playing"
              ? {
                  status: game.status === "won" ? "won" : "lost",
                  answer: game.answer,
                  results: game.results,
                  puzzleNumber: game.puzzleNumber,
                  isDaily: game.isDaily,
                  bestGreens: score.greens,
                  totalAttrs: score.total,
                }
              : undefined
          }
        />
      )}
    </>
  );
}
