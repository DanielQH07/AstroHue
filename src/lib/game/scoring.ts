import type { GuessRecord } from "@/src/types/game";
import type { HslColor } from "@/src/types/puzzle";
import { circularHueDistance } from "../color/hue";
import { COMPONENT_TOLERANCE } from "./feedback";

export function colorDistance(a: HslColor, b: HslColor): number {
  const hue = circularHueDistance(a.h, b.h) / 180;
  const saturation = Math.abs(a.s - b.s) / 100;
  const lightness = Math.abs(a.l - b.l) / 100;
  return Math.sqrt(hue ** 2 + saturation ** 2 + lightness ** 2);
}

export function colorScore(a: HslColor, b: HslColor): number {
  const hueDist = Math.abs(circularHueDistance(a.h, b.h));
  const satDist = Math.abs(a.s - b.s);
  const litDist = Math.abs(a.l - b.l);
  
  if (hueDist <= COMPONENT_TOLERANCE && satDist <= COMPONENT_TOLERANCE && litDist <= COMPONENT_TOLERANCE) {
    return 100;
  }

  const maximumDistance = Math.sqrt(3);
  const rawScore = Math.max(0, Math.round((1 - colorDistance(a, b) / maximumDistance) * 100));
  return rawScore >= 100 ? 99 : rawScore;
}

export function closestGuess(
  guesses: GuessRecord[],
  target: HslColor,
): GuessRecord | undefined {
  return guesses.reduce<GuessRecord | undefined>((best, current) => {
    if (!best) return current;
    return colorDistance(current.guess, target) <
      colorDistance(best.guess, target)
      ? current
      : best;
  }, undefined);
}
