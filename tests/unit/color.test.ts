import { describe, expect, it } from "vitest";
import {
  hexToHsl,
  hslToHex,
  hslToRgb,
  rgbToHsl,
} from "@/src/lib/color/conversions";
import { circularHueDistance, normalizeHue, signedHueDistance } from "@/src/lib/color/hue";
import { colorFamilyName } from "@/src/lib/color/naming";

describe("color utilities", () => {
  it("normalizes hue", () => {
    expect(normalizeHue(370)).toBe(10);
    expect(normalizeHue(-10)).toBe(350);
    expect(() => normalizeHue(Number.NaN)).toThrow();
  });

  it("uses signed circular hue distance", () => {
    expect(signedHueDistance(350, 10)).toBe(20);
    expect(signedHueDistance(10, 350)).toBe(-20);
    expect(signedHueDistance(180, 180)).toBe(0);
    expect(signedHueDistance(0, 180)).toBe(-180);
    expect(circularHueDistance(358, 3)).toBe(5);
  });

  it("converts known RGB and HSL values", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe("#00FF00");
    expect(hexToHsl("#0000ff")).toEqual({ h: 240, s: 100, l: 50 });
  });

  it("rejects invalid values", () => {
    expect(() => hslToRgb({ h: 0, s: 101, l: 50 })).toThrow();
    expect(() => rgbToHsl({ r: -1, g: 0, b: 0 })).toThrow();
    expect(() => hexToHsl("#fff")).toThrow();
  });

  it("returns readable color-family names", () => {
    expect(colorFamilyName(0)).toBe("Red");
    expect(colorFamilyName(240)).toBe("Blue");
    expect(colorFamilyName(350)).toBe("Red");
  });
});
