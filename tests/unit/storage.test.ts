import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_STATS,
  loadStorage,
  saveStorage,
  STORAGE_KEY,
  updateStats,
} from "@/src/lib/storage/localStats";

describe("local persistence", () => {
  beforeEach(() => localStorage.clear());

  it("falls back for invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{");
    expect(loadStorage().stats.gamesPlayed).toBe(0);
  });

  it("survives unavailable storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("blocked");
    });
    expect(saveStorage(loadStorage())).toBe(false);
  });

  it("updates wins, streaks, distribution, and losses", () => {
    const won = updateStats(EMPTY_STATS, true, 3);
    expect(won).toMatchObject({ gamesPlayed: 1, wins: 1, currentStreak: 1, bestStreak: 1 });
    expect(won.guessDistribution[2]).toBe(1);
    expect(updateStats(won, false, 5)).toMatchObject({ gamesPlayed: 2, losses: 1, currentStreak: 0 });
  });
});
