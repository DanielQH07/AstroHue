#!/usr/bin/env python3
"""Recompute AstroHue targets for locally stored NASA images."""

from __future__ import annotations

import colorsys
import json
import statistics
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "data" / "nasa-puzzles.generated.json"
METADATA = ROOT / "data" / "nasa-source-metadata.json"

def rounded(value: float) -> float:
    return round(value, 4)


def clamp(value: float, low: float, high: float) -> float:
    return min(high, max(low, value))


def hls(pixel: tuple[int, int, int]) -> tuple[float, float, float]:
    return colorsys.rgb_to_hls(pixel[0] / 255, pixel[1] / 255, pixel[2] / 255)


def valid(pixel: tuple[int, int, int]) -> bool:
    _h, lightness, saturation = hls(pixel)
    return 0.1 <= lightness <= 0.92 and saturation >= 0.18


def hue_gap(a: float, b: float) -> float:
    return abs(((a - b + 0.5) % 1.0) - 0.5)


def dominant_cluster(pixels: list[tuple[int, int, int]]) -> tuple[list[tuple[int, int, int]], float] | None:
    usable = [pixel for pixel in pixels if valid(pixel)]
    if len(usable) < max(24, len(pixels) * 0.35):
        return None
    bins: dict[tuple[int, int, int], list[tuple[int, int, int]]] = {}
    for pixel in usable:
        hue, lightness, saturation = hls(pixel)
        key = (round(hue * 24) % 24, round(saturation * 5), round(lightness * 5))
        bins.setdefault(key, []).append(pixel)
    cluster = max(bins.values(), key=len)
    coverage = len(cluster) / len(usable)
    if coverage < 0.34:
        return None
    hues = [hls(pixel)[0] for pixel in cluster]
    lights = [hls(pixel)[1] for pixel in cluster]
    sats = [hls(pixel)[2] for pixel in cluster]
    median_hue = statistics.median(hues)
    hue_variance = statistics.mean(hue_gap(hue, median_hue) for hue in hues)
    if hue_variance > 0.085 or statistics.pstdev(lights) > 0.18 or statistics.median(sats) < 0.2:
        return None
    return cluster, coverage


def median_rgb(pixels: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    return tuple(int(statistics.median(pixel[index] for pixel in pixels)) for index in range(3))  # type: ignore[return-value]


def inspection_region(x: float, y: float, width: int, height: int) -> dict[str, float]:
    aspect = width / height
    base = 0.44
    region_width = clamp(base if aspect >= 1 else base / aspect, 0.36, 0.54)
    region_height = clamp(base * aspect if aspect >= 1 else base, 0.36, 0.54)
    return {
        "centerX": rounded(clamp(x, region_width / 2, 1 - region_width / 2)),
        "centerY": rounded(clamp(y, region_height / 2, 1 - region_height / 2)),
        "width": rounded(region_width),
        "height": rounded(region_height),
    }


def create_mask(image: Image.Image, target_hue: float, target_lightness: float, target_saturation: float) -> Image.Image:
    work = image.convert("RGBA")
    pixels = work.load()
    mask = Image.new("RGBA", image.size, (255, 255, 255, 0))
    mask_pixels = mask.load()

    for y in range(work.height):
        for x in range(work.width):
            pixel = pixels[x, y]
            if not valid(pixel[:3]):
                continue
            h, l, s = hls(pixel[:3])
            
            h_dist = hue_gap(h, target_hue)
            l_dist = abs(l - target_lightness)
            s_dist = abs(s - target_saturation)
            
            if h_dist < 0.08 and l_dist < 0.18 and s_dist < 0.25:
                dist = (h_dist / 0.08) ** 2 + (l_dist / 0.18) ** 2 + (s_dist / 0.25) ** 2
                if dist <= 1.0:
                    alpha = int(255 * (1.0 - dist))
                    mask_pixels[x, y] = (255, 255, 255, alpha)
                    
    return mask


def retarget(image: Image.Image, filename: str) -> dict[str, Any]:
    work = image.convert("RGB")
    work.thumbnail((340, 340), Image.Resampling.LANCZOS)
    pixels = work.load()
    min_side = min(work.size)
    sample_radius = max(5, round(min_side * 0.026))
    context_radius = max(sample_radius * 3, round(min_side * 0.09))
    step = max(7, sample_radius)
    best: tuple[float, int, int, list[tuple[int, int, int]], float] | None = None

    for y in range(context_radius, work.height - context_radius, step):
        for x in range(context_radius, work.width - context_radius, step):
            patch = [
                pixels[px, py]
                for py in range(y - sample_radius, y + sample_radius + 1)
                for px in range(x - sample_radius, x + sample_radius + 1)
                if (px - x) ** 2 + (py - y) ** 2 <= sample_radius ** 2
            ]
            found = dominant_cluster(patch)
            if not found:
                continue
            cluster, coverage = found
            rgb = median_rgb(cluster)
            hue, lightness, saturation = hls(rgb)
            context_step = max(4, context_radius // 5)
            context = [
                pixels[px, py]
                for py in range(y - context_radius, y + context_radius + 1, context_step)
                for px in range(x - context_radius, x + context_radius + 1, context_step)
                if (px - x) ** 2 + (py - y) ** 2 <= context_radius ** 2 and valid(pixels[px, py])
            ]
            support = 0.0
            if context:
                support = sum(
                    1
                    for pixel in context
                    if hue_gap(hls(pixel)[0], hue) < 0.08
                    and abs(hls(pixel)[1] - lightness) < 0.18
                ) / len(context)
            edge = min(x, y, work.width - 1 - x, work.height - 1 - y) / max(1, min_side / 2)
            score = coverage * 1.1 + saturation * 1.0 + lightness * 0.65 + support * 0.75 + edge * 0.2
            if best is None or score > best[0]:
                best = (score, x, y, cluster, support)

    if best is None:
        for y in range(sample_radius, work.height - sample_radius, step):
            for x in range(sample_radius, work.width - sample_radius, step):
                patch = [
                    pixels[px, py]
                    for py in range(y - sample_radius, y + sample_radius + 1)
                    for px in range(x - sample_radius, x + sample_radius + 1)
                    if (px - x) ** 2 + (py - y) ** 2 <= sample_radius ** 2 and valid(pixels[px, py])
                ]
                if len(patch) < 24:
                    continue
                rgb = median_rgb(patch)
                _hue, lightness, saturation = hls(rgb)
                score = saturation * 1.2 + lightness
                if best is None or score > best[0]:
                    best = (score, x, y, patch, 0)

    if best is None:
        raise ValueError("no usable colored target found")

    _score, x, y, cluster, _support = best
    rgb = median_rgb(cluster)
    hue, lightness, saturation = hls(rgb)
    source_x = x / work.width
    source_y = y / work.height
    
    mask = create_mask(work, hue, lightness, saturation)
    mask_dir = ROOT / "public" / "astro" / "masks"
    mask_dir.mkdir(parents=True, exist_ok=True)
    mask_path = mask_dir / filename
    mask.save(mask_path, "WEBP", quality=85)
    
    return {
        "target": {"h": round(hue * 359), "s": round(saturation * 100), "l": round(lightness * 100)},
        "targetHex": f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}",
        "targetPoint": {"x": rounded(source_x), "y": rounded(source_y)},
        "samplePoint": {"x": rounded(source_x), "y": rounded(source_y)},
        "sampleRadius": 0.026,
        "maskSrc": f"/astro/masks/{filename}",
        "inspectionRegion": inspection_region(source_x, source_y, image.width, image.height),
    }


def main() -> int:
    metadata = json.loads(METADATA.read_text(encoding="utf-8"))
    kept: list[dict[str, Any]] = []
    for source in metadata:
        nasa_id = str(source["nasaId"])
        filename = f"{nasa_id.lower().replace('_', '-').replace(' ', '-')}.webp"
        path = ROOT / "public" / "astro" / "nasa" / filename
        if not path.exists():
            continue
        image = Image.open(path)
        try:
            target = retarget(image, filename)
        except ValueError as error:
            print(f"Skipped nasa-{filename.removesuffix('.webp')}: {error}")
            continue
        record = {
            "id": f"nasa-{filename.removesuffix('.webp')}",
            "imageSrc": f"/astro/nasa/{filename}",
            "title": source["originalTitle"],
            "description": source["description"],
            "credit": source["credit"],
            "sourceLabel": "NASA Image and Video Library",
            "sourceUrl": source["nasaRecordUrl"],
            "nasaId": nasa_id,
            "dateCreated": source.get("dateCreated"),
            "center": source.get("center"),
            "keywords": source.get("keywords", []),
            "width": image.width,
            "height": image.height,
            "imageSha256": source["finalSha256"],
        }
        record.update(target)
        record["rightsReview"] = {
            "status": "approved",
            "notes": "Astronomy image retained; target recomputed from a bright homogeneous sample patch. Manual sample-patch review recommended.",
        }
        kept.append(record)
    MANIFEST.write_text(json.dumps(kept, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Retargeted {len(kept)} NASA astronomy records.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
