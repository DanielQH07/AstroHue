import type { HslColor } from "@/src/types/puzzle";
import { normalizeHue } from "./hue";

export type RgbColor = { r: number; g: number; b: number };

function assertPercent(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${label} must be between 0 and 100.`);
  }
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  assertPercent(s, "Saturation");
  assertPercent(l, "Lightness");
  const hue = normalizeHue(h);
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  let rgb: [number, number, number];

  if (hue < 60) rgb = [chroma, x, 0];
  else if (hue < 120) rgb = [x, chroma, 0];
  else if (hue < 180) rgb = [0, chroma, x];
  else if (hue < 240) rgb = [0, x, chroma];
  else if (hue < 300) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  };
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  for (const [label, value] of Object.entries({ r, g, b })) {
    if (!Number.isFinite(value) || value < 0 || value > 255) {
      throw new RangeError(`${label.toUpperCase()} must be between 0 and 255.`);
    }
  }
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return {
    h: Math.round(normalizeHue(hue)),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b]
    .map((value) => Math.round(value).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function hslToHex(color: HslColor): string {
  return rgbToHex(hslToRgb(color));
}

export function hexToHsl(hex: string): HslColor {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new RangeError("HEX must contain exactly six digits.");
  const value = match[1];
  return rgbToHsl({
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  });
}
