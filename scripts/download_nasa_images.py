#!/usr/bin/env python3
"""Download, normalize, and analyze NASA Image Library astronomy records."""

from __future__ import annotations

import argparse
import colorsys
import csv
import hashlib
import io
import json
import logging
import random
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import quote

import requests
from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
API = "https://images-api.nasa.gov"
DEFAULT_QUERIES = [
    "nebula", "emission nebula", "planetary nebula", "spiral galaxy",
    "interacting galaxies", "star cluster", "supernova remnant", "Milky Way",
    "Jupiter", "Saturn", "Mars surface", "Moon surface", "solar atmosphere",
    "aurora from space", "Earth at night", "comet", "asteroid",
    "exoplanet observatory image", "deep field", "stellar nursery",
]
REJECT_TERMS = {
    "logo", "infographic", "illustration", "diagram", "chart", "poster",
    "icon", "screenshot", "artist concept", "artist impression", "rendering",
    "animation", "map", "portrait", "press conference", "launch ceremony",
    "panel discussion", "media briefing", "payload hazardous servicing",
    "hardware for controlling", "visualization of the complex", "speaks during",
    "spacecraft functional testing", "has been given the formal designation",
    "graphic art", "this is a representation",
    "this 1970 photograph shows skylab",
    "interior of ganymede", "solar aircraft", "eva 22",
    "phoenix soaks up the sun", "surface topography",
}
COPYRIGHT_TERMS = {"copyright", "courtesy of", "all rights reserved", "esa", "stsci"}
USER_AGENT = "AstroHue/1.0 educational content preparation"
LOG = logging.getLogger("astrohue.content")


@dataclass(frozen=True)
class Candidate:
    nasa_id: str
    title: str
    description: str
    center: str
    date_created: str
    keywords: list[str]
    photographer: str
    record_url: str


class NasaClient:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT

    def get(self, url: str, *, attempts: int = 5) -> requests.Response:
        for attempt in range(attempts):
            try:
                response = self.session.get(url, timeout=(10, 45))
                if response.status_code == 429 or response.status_code >= 500:
                    delay = min(30, 2 ** attempt) + random.random()
                    LOG.warning("Transient HTTP %s; retrying in %.1fs", response.status_code, delay)
                    time.sleep(delay)
                    continue
                response.raise_for_status()
                return response
            except requests.RequestException:
                if attempt == attempts - 1:
                    raise
                time.sleep(min(30, 2 ** attempt) + random.random())
        raise RuntimeError("unreachable")


def safe_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:70] or "nasa-image"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def metadata_text(item: dict[str, Any]) -> str:
    data = item.get("data", [{}])[0]
    return " ".join(
        str(data.get(key, "")) for key in ("title", "description", "keywords")
    ).lower()


def search_candidates(client: NasaClient, queries: Iterable[str]) -> list[Candidate]:
    found: dict[str, Candidate] = {}
    for query in queries:
        url = f"{API}/search?q={quote(query)}&media_type=image&page_size=40"
        payload = client.get(url).json()
        for item in payload.get("collection", {}).get("items", []):
            data = item.get("data", [{}])[0]
            nasa_id = str(data.get("nasa_id", "")).strip()
            text = metadata_text(item)
            unsuitable_family = nasa_id.upper().startswith(("NHQ", "KSC"))
            if (
                not nasa_id
                or unsuitable_family
                or any(term in text for term in REJECT_TERMS)
            ):
                continue
            found.setdefault(
                nasa_id,
                Candidate(
                    nasa_id=nasa_id,
                    title=str(data.get("title") or nasa_id),
                    description=str(data.get("description") or data.get("description_508") or ""),
                    center=str(data.get("center") or ""),
                    date_created=str(data.get("date_created") or ""),
                    keywords=[str(value) for value in data.get("keywords", [])],
                    photographer=str(data.get("photographer") or data.get("secondary_creator") or ""),
                    record_url=f"https://images.nasa.gov/details/{quote(nasa_id)}",
                ),
            )
    return list(found.values())


def choose_asset(client: NasaClient, nasa_id: str) -> str:
    assets = client.get(f"{API}/asset/{quote(nasa_id)}").json()
    urls = [
        item["href"] for item in assets.get("collection", {}).get("items", [])
        if item.get("href", "").lower().split("?")[0].endswith((".jpg", ".jpeg", ".png", ".tif", ".tiff"))
    ]
    if not urls:
        raise ValueError("no raster assets")
    def rank(url: str) -> tuple[int, int]:
        lower = url.lower()
        score = 4 if "~orig" in lower else 3 if "~large" in lower else 2 if "~medium" in lower else 0
        return score, len(url)
    return max(urls, key=rank)


def load_image(client: NasaClient, url: str) -> tuple[bytes, Image.Image]:
    response = client.get(url)
    content_type = response.headers.get("content-type", "")
    if not content_type.startswith("image/"):
        raise ValueError(f"unexpected content type {content_type}")
    raw = response.content
    try:
        image = Image.open(io.BytesIO(raw))
        image.load()
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("corrupt image") from error
    return raw, ImageOps.exif_transpose(image).convert("RGB")


def quantized_candidates(image: Image.Image) -> list[dict[str, Any]]:
    work = image.copy()
    work.thumbnail((256, 256), Image.Resampling.LANCZOS)
    quantized = work.quantize(colors=12, method=Image.Quantize.MEDIANCUT)
    palette = quantized.getpalette() or []
    counts = sorted(quantized.getcolors() or [], reverse=True)
    indices = list(quantized.getdata())
    total = work.width * work.height
    candidates: list[dict[str, Any]] = []
    for count, index in counts:
        r, g, b = palette[index * 3:index * 3 + 3]
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if not (0.08 <= l <= 0.92 and s >= 0.18):
            continue
        frequency = count / total
        if frequency < 0.008 or frequency > 0.72:
            continue
        positions = [
            (position % work.width, position // work.width)
            for position, palette_index in enumerate(indices)
            if palette_index == index
        ]
        edge_support = sum(
            min(x, y, work.width - 1 - x, work.height - 1 - y)
            / max(1, min(work.width, work.height) / 2)
            for x, y in positions
        ) / len(positions)
        score = (
            frequency * 2.5
            + s * 0.35
            + (1 - abs(l - 0.5) * 2) * 0.25
            + edge_support * 0.2
        )
        candidates.append({
            "rgb": (r, g, b), "h": round(h * 359), "s": round(s * 100),
            "l": round(l * 100), "hex": f"#{r:02X}{g:02X}{b:02X}", "score": round(score, 4),
        })
    for candidate in candidates:
        others = [item for item in candidates if item is not candidate]
        distinctness = min(
            (
                sum((candidate["rgb"][channel] - other["rgb"][channel]) ** 2 for channel in range(3))
                ** 0.5
                / 441.7
            )
            for other in others
        ) if others else 1
        candidate["score"] = round(candidate["score"] + distinctness * 0.2, 4)
    return sorted(candidates, key=lambda value: value["score"], reverse=True)


def inspection_region(point: dict[str, float], image: Image.Image) -> dict[str, float]:
    aspect = image.width / image.height
    base = 0.3
    width = min(0.36, max(0.22, base if aspect >= 1 else base / aspect))
    height = min(0.36, max(0.22, base * aspect if aspect >= 1 else base))
    center_x = min(1 - width / 2, max(width / 2, point["x"]))
    center_y = min(1 - height / 2, max(height / 2, point["y"]))
    return {
        "centerX": round(center_x, 4),
        "centerY": round(center_y, 4),
        "width": round(width, 4),
        "height": round(height, 4),
    }


def valid_sample_pixel(rgb: tuple[int, int, int]) -> bool:
    h, l, s = colorsys.rgb_to_hls(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
    # These thresholds reject empty sky/background, clipped stars, and neutral noise.
    return 0.08 <= l <= 0.92 and s >= 0.18


def robust_target(image: Image.Image, candidate: dict[str, Any]) -> tuple[dict[str, int], str, dict[str, float], float, dict[str, float]]:
    work = image.copy()
    work.thumbnail((256, 256), Image.Resampling.LANCZOS)
    target_rgb = candidate["rgb"]
    matching: list[tuple[float, int, int]] = []
    for y in range(work.height):
        for x in range(work.width):
            rgb = work.getpixel((x, y))
            distance = sum((rgb[i] - target_rgb[i]) ** 2 for i in range(3))
            edge = min(x, y, work.width - 1 - x, work.height - 1 - y)
            matching.append((distance - edge * 2, x, y))
    _, x, y = min(matching)
    scale_x, scale_y = image.width / work.width, image.height / work.height
    center_x, center_y = round(x * scale_x), round(y * scale_y)
    radius = max(8, round(min(image.size) * 0.018))
    patch = image.crop((
        max(0, center_x - radius), max(0, center_y - radius),
        min(image.width, center_x + radius + 1), min(image.height, center_y + radius + 1),
    ))
    valid_pixels = [rgb for rgb in patch.getdata() if valid_sample_pixel(rgb)]
    if len(valid_pixels) < max(40, len(list(patch.getdata())) * 0.35):
        raise ValueError("sample patch lacks enough valid colored pixels")
    dominant = [
        rgb for rgb in valid_pixels
        if sum((rgb[index] - target_rgb[index]) ** 2 for index in range(3)) ** 0.5 <= 42
    ]
    coverage = len(dominant) / len(valid_pixels)
    if coverage < 0.6:
        raise ValueError("sample patch is too heterogeneous")
    channels = [sorted(pixel[index] for pixel in dominant) for index in range(3)]
    r, g, b = [values[len(values) // 2] for values in channels]
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    if s < 0.18 or not (0.08 <= l <= 0.92):
        raise ValueError("sample patch target is gray or near an extreme")
    target = {"h": round(h * 359), "s": round(s * 100), "l": round(l * 100)}
    point = {"x": round(center_x / image.width, 4), "y": round(center_y / image.height, 4)}
    return target, f"#{r:02X}{g:02X}{b:02X}", point, round(radius / min(image.size), 4), inspection_region(point, image)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=20)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--query", action="append", dest="queries")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "public" / "astro" / "nasa")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    random.seed(args.seed)
    client = NasaClient()
    candidates = search_candidates(client, args.queries or DEFAULT_QUERIES)
    random.shuffle(candidates)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    puzzles: list[dict[str, Any]] = []
    metadata: list[dict[str, Any]] = []
    seen_hashes: set[str] = set()

    for candidate in candidates:
        if len(puzzles) >= args.count:
            break
        try:
            asset_url = choose_asset(client, candidate.nasa_id)
            raw, image = load_image(client, asset_url)
            if max(image.size) < 1200:
                raise ValueError("image resolution below 1200px")
            raw_hash = sha256(raw)
            if raw_hash in seen_hashes:
                continue
            seen_hashes.add(raw_hash)
            original_size = image.size
            image.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
            filename = f"{safe_slug(candidate.nasa_id)}.webp"
            output = args.output_dir / filename
            if args.force or not output.exists():
                temporary = output.with_suffix(".webp.tmp")
                image.save(temporary, "WEBP", quality=88, method=6)
                temporary.replace(output)
            final_bytes = output.read_bytes()
            palette = quantized_candidates(image)
            if not palette:
                raise ValueError("no usable color candidates")
            target, target_hex, point, sample_radius, inspect = robust_target(image, palette[0])
            indicators = sorted(term for term in COPYRIGHT_TERMS if term in (candidate.description + " " + candidate.photographer).lower())
            puzzle_id = f"nasa-{safe_slug(candidate.nasa_id)}"
            puzzle = {
                "id": puzzle_id, "imageSrc": f"/astro/nasa/{filename}",
                "title": candidate.title, "description": candidate.description,
                "credit": candidate.photographer or candidate.center or "NASA",
                "sourceLabel": "NASA Image and Video Library", "sourceUrl": candidate.record_url,
                "nasaId": candidate.nasa_id, "dateCreated": candidate.date_created,
                "center": candidate.center, "keywords": candidate.keywords,
                "width": image.width, "height": image.height, "target": target,
                "targetHex": target_hex, "targetPoint": point,
                "samplePoint": point, "sampleRadius": sample_radius,
                "inspectionRegion": inspect,
                "imageSha256": sha256(final_bytes),
                "paletteCandidates": [{key: value for key, value in item.items() if key != "rgb"} for item in palette[:5]],
                "rightsReview": {"status": "pending", "notes": "Manual rights and attribution review required."},
            }
            puzzles.append(puzzle)
            metadata.append({
                "nasaId": candidate.nasa_id, "originalTitle": candidate.title,
                "description": candidate.description, "photographer": candidate.photographer,
                "center": candidate.center, "dateCreated": candidate.date_created,
                "keywords": candidate.keywords, "originalAssetUrl": asset_url,
                "nasaRecordUrl": candidate.record_url,
                "downloadTimestamp": datetime.now(timezone.utc).isoformat(),
                "originalDimensions": list(original_size), "finalDimensions": list(image.size),
                "originalSha256": raw_hash, "finalSha256": sha256(final_bytes),
                "credit": puzzle["credit"], "potentialThirdPartyIndicators": indicators,
                "rightsReviewStatus": "pending", "rightsReviewNotes": "Manual review required.",
            })
            LOG.info("Prepared %s (%s/%s)", candidate.nasa_id, len(puzzles), args.count)
        except (requests.RequestException, ValueError, OSError) as error:
            LOG.warning("Skipped %s: %s", candidate.nasa_id, error)

    manifest_path = ROOT / "src" / "data" / "nasa-puzzles.generated.json"
    decisions_path = ROOT / "data" / "nasa-rights-decisions.json"
    if decisions_path.exists():
        decisions = json.loads(decisions_path.read_text(encoding="utf-8"))
        for puzzle in puzzles:
            if puzzle["nasaId"] in decisions:
                puzzle["rightsReview"] = decisions[puzzle["nasaId"]]
        for record in metadata:
            if record["nasaId"] in decisions:
                decision = decisions[record["nasaId"]]
                record["rightsReviewStatus"] = decision["status"]
                record["rightsReviewNotes"] = decision["notes"]
    write_json(manifest_path, puzzles)
    write_json(ROOT / "data" / "nasa-source-metadata.json", metadata)
    review_path = ROOT / "data" / "nasa-rights-review.csv"
    review_path.parent.mkdir(parents=True, exist_ok=True)
    with review_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["nasaId", "title", "credit", "status", "notes", "sourceUrl"])
        writer.writeheader()
        for puzzle in puzzles:
            writer.writerow({
                "nasaId": puzzle["nasaId"], "title": puzzle["title"],
                "credit": puzzle["credit"], "status": puzzle["rightsReview"]["status"],
                "notes": puzzle["rightsReview"]["notes"],
                "sourceUrl": puzzle["sourceUrl"],
            })
    LOG.info("Prepared %s of %s requested images.", len(puzzles), args.count)
    return 0 if len(puzzles) == args.count else 2


if __name__ == "__main__":
    raise SystemExit(main())
