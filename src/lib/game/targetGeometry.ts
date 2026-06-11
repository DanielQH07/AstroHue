import type { AstroPuzzle, NormalizedPoint, NormalizedRegion } from "@/src/types/puzzle";

const DEFAULT_SAMPLE_RADIUS = 0.018;
const MIN_REGION_SIDE = 0.22;
const MAX_REGION_SIDE = 0.36;
const BASE_REGION_SIDE = 0.3;

function rounded(value: number) {
  return Number(value.toFixed(4));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function deriveInspectionRegion(
  samplePoint: NormalizedPoint,
  imageWidth: number,
  imageHeight: number,
): NormalizedRegion {
  const aspect = imageWidth / imageHeight;
  const width = clamp(aspect >= 1 ? BASE_REGION_SIDE : BASE_REGION_SIDE / aspect, MIN_REGION_SIDE, MAX_REGION_SIDE);
  const height = clamp(aspect >= 1 ? BASE_REGION_SIDE * aspect : BASE_REGION_SIDE, MIN_REGION_SIDE, MAX_REGION_SIDE);
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return {
    centerX: rounded(clamp(samplePoint.x, halfWidth, 1 - halfWidth)),
    centerY: rounded(clamp(samplePoint.y, halfHeight, 1 - halfHeight)),
    width: rounded(width),
    height: rounded(height),
  };
}

export function regionBounds(region: NormalizedRegion) {
  return {
    left: rounded(region.centerX - region.width / 2),
    top: rounded(region.centerY - region.height / 2),
    width: region.width,
    height: region.height,
  };
}

export function pointInRegion(point: NormalizedPoint, region: NormalizedRegion) {
  const bounds = regionBounds(region);
  return (
    point.x >= bounds.left &&
    point.x <= bounds.left + bounds.width &&
    point.y >= bounds.top &&
    point.y <= bounds.top + bounds.height
  );
}

export function publicTargetGeometry(puzzle: AstroPuzzle) {
  const samplePoint = puzzle.samplePoint ?? puzzle.targetPoint;
  const sampleRadius = puzzle.sampleRadius ?? DEFAULT_SAMPLE_RADIUS;
  const inspectionRegion =
    puzzle.inspectionRegion ?? deriveInspectionRegion(samplePoint, puzzle.width, puzzle.height);

  return {
    samplePoint: {
      x: rounded(samplePoint.x),
      y: rounded(samplePoint.y),
    },
    sampleRadius: rounded(sampleRadius),
    inspectionRegion,
  };
}

/** Diameter of the restoration circle as a fraction of the rendered image's shorter side. */
export const RESTORATION_PATCH_FRAC = 0.18;

/** Compute the CSS brightness factor from a lightness value (0–100). */
export function restorationBrightness(lightness: number): number {
  return 0.15 + (lightness / 100) * 1.7;
}
