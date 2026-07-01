import { useCallback, useEffect, useMemo, useState } from "react";
import type { Corner, Difficulty } from "../types/corner";
import { DIFFICULTY_CONFIG } from "../types/corner";
import { compareGuess, type GuessResult } from "../lib/compare";
import { load, save } from "../lib/storage";
import { puzzleNumber } from "../lib/rng";
import { recordResult } from "../lib/stats";
import { dailyCorner, getCorner, randomCorner } from "./data";

export type Mode = "daily" | "practice";
export type Status = "playing" | "won" | "lost";

const PREF_KEY = "pref:difficulty";
const dailyKey = (d: Difficulty, p: number) => `daily:${d}:${p}`;

interface SavedDaily {
  answerId: string;
  guessIds: string[];
  status: Status;
}

export interface Game {
  difficulty: Difficulty;
  mode: Mode;
  status: Status;
  answer: Corner;
  results: GuessResult[];
  guessedIds: string[];
  guessesUsed: number;
  maxGuesses: number;
  remaining: number;
  puzzleNumber: number;
  isDaily: boolean;
  submitGuess: (cornerId: string) => void;
  setDifficulty: (d: Difficulty) => void;
  startPractice: () => void;
  startDaily: () => void;
}

export function useGame(): Game {
  const puzzle = useMemo(() => puzzleNumber(), []);
  const initialDifficulty: Difficulty = "rookie";

  const [difficulty, setDifficultyState] = useState<Difficulty>(initialDifficulty);
  const [mode, setMode] = useState<Mode>("daily");
  const [answerId, setAnswerId] = useState<string>(() => dailyCorner(initialDifficulty).id);
  const [guessedIds, setGuessedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("playing");

  // restore a previously-saved daily session for today, once on mount
  useEffect(() => {
    const saved = load<SavedDaily | null>(dailyKey(initialDifficulty, puzzle), null);
    if (saved && saved.answerId === answerId) {
      setGuessedIds(saved.guessIds);
      setStatus(saved.status);
    }
    // run once; deliberately not reacting to later state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const begin = useCallback(
    (nextMode: Mode, nextDiff: Difficulty) => {
      setMode(nextMode);
      setDifficultyState(nextDiff);
      if (nextMode === "daily") {
        const ans = dailyCorner(nextDiff);
        setAnswerId(ans.id);
        const saved = load<SavedDaily | null>(dailyKey(nextDiff, puzzle), null);
        if (saved && saved.answerId === ans.id) {
          setGuessedIds(saved.guessIds);
          setStatus(saved.status);
        } else {
          setGuessedIds([]);
          setStatus("playing");
        }
      } else {
        setAnswerId(randomCorner().id);
        setGuessedIds([]);
        setStatus("playing");
      }
    },
    [puzzle],
  );

  const setDifficulty = useCallback(
    (d: Difficulty) => {
      save(PREF_KEY, d);
      begin(mode, d);
    },
    [begin, mode],
  );

  const startPractice = useCallback(() => begin("practice", difficulty), [begin, difficulty]);
  const startDaily = useCallback(() => begin("daily", difficulty), [begin, difficulty]);

  const maxGuesses = DIFFICULTY_CONFIG[difficulty].guesses;
  const answer = getCorner(answerId);

  const results = useMemo(
    () => guessedIds.map((id) => compareGuess(getCorner(id), answer, difficulty)),
    [guessedIds, answer, difficulty],
  );

  const submitGuess = useCallback(
    (cornerId: string) => {
      if (status !== "playing" || guessedIds.includes(cornerId)) return;
      const res = compareGuess(getCorner(cornerId), answer, difficulty);
      const next = [...guessedIds, cornerId];
      let nextStatus: Status = "playing";
      if (res.correct) nextStatus = "won";
      else if (next.length >= maxGuesses) nextStatus = "lost";

      setGuessedIds(next);
      setStatus(nextStatus);

      if (mode === "daily") {
        save(dailyKey(difficulty, puzzle), {
          answerId,
          guessIds: next,
          status: nextStatus,
        });
        if (nextStatus !== "playing") {
          recordResult(difficulty, nextStatus === "won", next.length);
        }
      }
    },
    [status, guessedIds, answer, difficulty, maxGuesses, mode, answerId, puzzle],
  );

  return {
    difficulty,
    mode,
    status,
    answer,
    results,
    guessedIds,
    guessesUsed: guessedIds.length,
    maxGuesses,
    remaining: maxGuesses - guessedIds.length,
    puzzleNumber: puzzle,
    isDaily: mode === "daily",
    submitGuess,
    setDifficulty,
    startPractice,
    startDaily,
  };
}
