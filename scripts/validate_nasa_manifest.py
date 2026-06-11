#!/usr/bin/env python3
"""Validate AstroHue's private puzzle manifest and local image assets."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "data" / "nasa-puzzles.generated.json"


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def validate_record(record: dict[str, Any], index: int, errors: list[str]) -> None:
    prefix = f"record {index}"
    required = (
        "id", "imageSrc", "credit", "sourceUrl", "target", "targetPoint",
        "samplePoint", "sampleRadius", "inspectionRegion",
    )
    for key in required:
        if not record.get(key):
            fail(f"{prefix}: missing {key}", errors)

    target = record.get("target", {})
    if not (
        isinstance(target.get("h"), int)
        and 0 <= target["h"] <= 359
        and isinstance(target.get("s"), int)
        and 0 <= target["s"] <= 100
        and isinstance(target.get("l"), int)
        and 0 <= target["l"] <= 100
    ):
        fail(f"{prefix}: invalid target HSL", errors)
    elif target["s"] < 18 or target["l"] < 8 or target["l"] > 92:
        fail(f"{prefix}: target is gray or near an extreme", errors)

    point = record.get("targetPoint", {})
    if not all(
        isinstance(point.get(axis), (int, float)) and 0 <= point[axis] <= 1
        for axis in ("x", "y")
    ):
        fail(f"{prefix}: invalid target point", errors)

    sample = record.get("samplePoint", {})
    if not all(
        isinstance(sample.get(axis), (int, float)) and 0 <= sample[axis] <= 1
        for axis in ("x", "y")
    ):
        fail(f"{prefix}: invalid sample point", errors)
    radius = record.get("sampleRadius")
    if not isinstance(radius, (int, float)) or not 0 < radius <= 0.08:
        fail(f"{prefix}: invalid sample radius", errors)
    region = record.get("inspectionRegion", {})
    if not all(
        isinstance(region.get(key), (int, float))
        for key in ("centerX", "centerY", "width", "height")
    ):
        fail(f"{prefix}: invalid inspection region", errors)
    else:
        left = region["centerX"] - region["width"] / 2
        top = region["centerY"] - region["height"] / 2
        right = region["centerX"] + region["width"] / 2
        bottom = region["centerY"] + region["height"] / 2
        if left < 0 or top < 0 or right > 1 or bottom > 1:
            fail(f"{prefix}: inspection region is outside image bounds", errors)
        elif not (left <= sample.get("x", -1) <= right and top <= sample.get("y", -1) <= bottom):
            fail(f"{prefix}: inspection region does not contain sample point", errors)

    image_src = record.get("imageSrc", "")
    if not image_src.startswith("/"):
        fail(f"{prefix}: imageSrc must be root-relative", errors)
    elif not (ROOT / "public" / image_src.removeprefix("/")).is_file():
        fail(f"{prefix}: missing image {image_src}", errors)


def main() -> int:
    if not MANIFEST.is_file():
        print(f"Missing manifest: {MANIFEST}", file=sys.stderr)
        return 1
    try:
        records = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"Could not read manifest: {error}", file=sys.stderr)
        return 1

    errors: list[str] = []
    ids: set[str] = set()
    hashes: set[str] = set()
    for index, record in enumerate(records):
        validate_record(record, index, errors)
        puzzle_id = record.get("id")
        image_hash = record.get("imageSha256")
        if puzzle_id in ids:
            fail(f"record {index}: duplicate id {puzzle_id}", errors)
        ids.add(puzzle_id)
        if image_hash in hashes:
            fail(f"record {index}: duplicate image hash {image_hash}", errors)
        hashes.add(image_hash)

    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors), file=sys.stderr)
        return 1
    digest = hashlib.sha256(MANIFEST.read_bytes()).hexdigest()[:12]
    print(f"Validated {len(records)} puzzle records (manifest {digest}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
