export function normalizeHue(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("Hue must be a finite number.");
  }
  return ((value % 360) + 360) % 360;
}

export function signedHueDistance(guess: number, target: number): number {
  return ((normalizeHue(target) - normalizeHue(guess) + 540) % 360) - 180;
}

export function circularHueDistance(a: number, b: number): number {
  return Math.abs(signedHueDistance(a, b));
}
