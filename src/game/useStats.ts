import { useEffect, useState } from "react";
import type { Difficulty } from "../types/corner";
import { readStats, subscribeStats, type Stats } from "../lib/stats";

/** Live per-difficulty stats; re-reads whenever a daily game is recorded. */
export function useStats(difficulty: Difficulty): Stats {
  const [stats, setStats] = useState<Stats>(() => readStats(difficulty));
  useEffect(() => {
    setStats(readStats(difficulty));
    return subscribeStats(() => setStats(readStats(difficulty)));
  }, [difficulty]);
  return stats;
}
