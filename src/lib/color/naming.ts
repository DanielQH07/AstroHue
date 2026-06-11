import { normalizeHue } from "./hue";

const COLOR_FAMILIES = [
  "Red",
  "Vermilion",
  "Orange",
  "Amber",
  "Yellow",
  "Lime",
  "Green",
  "Teal",
  "Cyan",
  "Azure",
  "Blue",
  "Indigo",
  "Violet",
  "Magenta",
  "Rose",
] as const;

export function colorFamilyName(hue: number): string {
  const index = Math.floor((normalizeHue(hue) + 12) / 24) % COLOR_FAMILIES.length;
  return COLOR_FAMILIES[index];
}
