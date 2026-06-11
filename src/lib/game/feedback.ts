import type { GuessFeedback } from "@/src/types/game";
import type { HslColor } from "@/src/types/puzzle";
import { signedHueDistance } from "../color/hue";

export const COMPONENT_TOLERANCE = 2;

export function createFeedback(
  guess: HslColor,
  target: HslColor,
): GuessFeedback {
  const hueDistance = signedHueDistance(guess.h, target.h);
  const saturationDistance = target.s - guess.s;
  const lightnessDistance = target.l - guess.l;

  return {
    hue: {
      status:
        Math.abs(hueDistance) <= COMPONENT_TOLERANCE
          ? "correct"
          : hueDistance > 0
            ? "clockwise"
            : "counter-clockwise",
      symbol:
        Math.abs(hueDistance) <= COMPONENT_TOLERANCE
          ? "✓"
          : hueDistance > 0
            ? ">"
            : "<",
    },
    saturation: {
      status:
        Math.abs(saturationDistance) <= COMPONENT_TOLERANCE
          ? "correct"
          : saturationDistance > 0
            ? "more-vivid"
            : "more-muted",
      symbol:
        Math.abs(saturationDistance) <= COMPONENT_TOLERANCE
          ? "✓"
          : saturationDistance > 0
            ? ">"
            : "<",
    },
    lightness: {
      status:
        Math.abs(lightnessDistance) <= COMPONENT_TOLERANCE
          ? "correct"
          : lightnessDistance > 0
            ? "lighter"
            : "darker",
      symbol:
        Math.abs(lightnessDistance) <= COMPONENT_TOLERANCE
          ? "✓"
          : lightnessDistance > 0
            ? ">"
            : "<",
    },
  };
}

export function isWinningFeedback(feedback: GuessFeedback): boolean {
  return (
    feedback.hue.status === "correct" &&
    feedback.saturation.status === "correct" &&
    feedback.lightness.status === "correct"
  );
}
