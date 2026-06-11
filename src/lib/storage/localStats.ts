import type { GuessRecord } from "@/src/types/game";
import type { HslColor, PublicPuzzle } from "@/src/types/puzzle";

export const STORAGE_KEY = "astrohue:v1";

export type GameStats = {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  guessDistribution: [number, number, number, number, number];
  losses: number;
};

export type StoredRound = {
  roundToken: string;
  puzzle: PublicPuzzle;
  guess: HslColor;
  history: GuessRecord[];
};

export type AstroStorage = {
  version: 1;
  onboardingDismissed: boolean;
  scores: Record<string, number>;
  stats: GameStats;
  round?: StoredRound;
};

export const EMPTY_STATS: GameStats = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0],
  losses: 0,
};

export const DEFAULT_STORAGE: AstroStorage = {
  version: 1,
  onboardingDismissed: false,
  scores: {},
  stats: EMPTY_STATS,
};

export function loadStorage(): AstroStorage {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STORAGE);
    const parsed = JSON.parse(raw) as Partial<AstroStorage> & { playedIds?: string[] };
    if (parsed.version !== 1) return structuredClone(DEFAULT_STORAGE);
    const round =
      parsed.round?.puzzle?.inspectionRegion && parsed.round.puzzle.samplePoint
        ? parsed.round
        : undefined;
    return {
      version: 1,
      onboardingDismissed: Boolean(parsed.onboardingDismissed),
      scores: typeof parsed.scores === "object" && parsed.scores !== null
        ? parsed.scores
        : Array.isArray(parsed.playedIds)
          ? Object.fromEntries(parsed.playedIds.filter(id => typeof id === "string").map((id) => [id, 0]))
          : {},
      stats: { ...EMPTY_STATS, ...parsed.stats },
      ...(round ? { round } : {}),
    };
  } catch {
    return structuredClone(DEFAULT_STORAGE);
  }
}

export function saveStorage(storage: AstroStorage): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    return true;
  } catch {
    return false;
  }
}

export function updateStats(
  stats: GameStats,
  won: boolean,
  attempt: number,
): GameStats {
  const distribution = [...stats.guessDistribution] as GameStats["guessDistribution"];
  if (won) distribution[attempt - 1] += 1;
  const currentStreak = won ? stats.currentStreak + 1 : 0;
  return {
    gamesPlayed: stats.gamesPlayed + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    guessDistribution: distribution,
    losses: stats.losses + (won ? 0 : 1),
  };
}
