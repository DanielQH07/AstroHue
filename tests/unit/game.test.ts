import { describe, expect, it } from "vitest";
import { createFeedback, isWinningFeedback } from "@/src/lib/game/feedback";
import { closestGuess } from "@/src/lib/game/scoring";
import { selectPuzzle } from "@/src/lib/game/selection";
import { normalizeHue } from "@/src/lib/color/hue";
import { deriveInspectionRegion, pointInRegion } from "@/src/lib/game/targetGeometry";
import type { AstroPuzzle } from "@/src/types/puzzle";

describe("game logic", () => {
  it("creates circular and linear feedback", () => {
    expect(createFeedback({ h: 350, s: 20, l: 80 }, { h: 10, s: 50, l: 50 })).toEqual({
      hue: { status: "clockwise", symbol: ">" },
      saturation: { status: "more-vivid", symbol: ">" },
      lightness: { status: "darker", symbol: "<" },
    });
    expect(createFeedback({ h: 10, s: 80, l: 20 }, { h: 350, s: 50, l: 50 })).toEqual({
      hue: { status: "counter-clockwise", symbol: "<" },
      saturation: { status: "more-muted", symbol: "<" },
      lightness: { status: "lighter", symbol: ">" },
    });
  });

  it("honors exact tolerance boundaries", () => {
    const feedback = createFeedback({ h: 0, s: 48, l: 52 }, { h: 358, s: 50, l: 50 });
    expect(isWinningFeedback(feedback)).toBe(true);
    expect(isWinningFeedback(createFeedback({ h: 1, s: 47, l: 53 }, { h: 358, s: 50, l: 50 }))).toBe(false);
  });

  it("creates concise feedback symbols at hue boundaries", () => {
    expect(createFeedback({ h: 350, s: 50, l: 50 }, { h: 10, s: 50, l: 50 }).hue.symbol).toBe(">");
    expect(createFeedback({ h: 10, s: 50, l: 50 }, { h: 350, s: 50, l: 50 }).hue.symbol).toBe("<");
    expect(createFeedback({ h: 180, s: 50, l: 50 }, { h: 180, s: 50, l: 50 }).hue.symbol).toBe("✓");
    expect(createFeedback({ h: 0, s: 50, l: 50 }, { h: 180, s: 50, l: 50 }).hue.symbol).toBe("<");
    expect(normalizeHue(359 + 1)).toBe(0);
    expect(normalizeHue(0 - 1)).toBe(359);
  });

  it("derives clamped inspection regions that contain the sample", () => {
    for (const [width, height] of [[1600, 900], [900, 1600], [2400, 700]]) {
      const sample = { x: 0.04, y: 0.96 };
      const region = deriveInspectionRegion(sample, width, height);
      expect(pointInRegion(sample, region)).toBe(true);
      expect(region.centerX - region.width / 2).toBeGreaterThanOrEqual(0);
      expect(region.centerY - region.height / 2).toBeGreaterThanOrEqual(0);
      expect(region.centerX + region.width / 2).toBeLessThanOrEqual(1);
      expect(region.centerY + region.height / 2).toBeLessThanOrEqual(1);
    }
  });

  it("chooses the earliest closest guess on ties", () => {
    const feedback = createFeedback({ h: 10, s: 50, l: 50 }, { h: 20, s: 50, l: 50 });
    const guesses = [
      { attempt: 1, guess: { h: 10, s: 50, l: 50 }, hex: "#111111", score: 97, feedback },
      { attempt: 2, guess: { h: 30, s: 50, l: 50 }, hex: "#222222", score: 97, feedback },
    ];
    expect(closestGuess(guesses, { h: 20, s: 50, l: 50 })?.attempt).toBe(1);
  });

  it("excludes played puzzles and resets an exhausted pool", () => {
    const puzzles = [
      { id: "a" } as AstroPuzzle,
      { id: "b" } as AstroPuzzle,
    ];
    expect(selectPuzzle(puzzles, ["a"]).id).toBe("b");
    expect(["a", "b"]).toContain(selectPuzzle(puzzles, ["a", "b"]).id);
  });
});
