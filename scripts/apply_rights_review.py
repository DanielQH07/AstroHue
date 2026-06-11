#!/usr/bin/env python3
"""Apply explicit manual review decisions to generated AstroHue content."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "data" / "nasa-puzzles.generated.json"
METADATA = ROOT / "data" / "nasa-source-metadata.json"
DECISIONS = ROOT / "data" / "nasa-rights-decisions.json"
CSV_PATH = ROOT / "data" / "nasa-rights-review.csv"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    puzzles = read_json(MANIFEST)
    metadata = read_json(METADATA)
    decisions = read_json(DECISIONS)
    applied = 0

    for puzzle in puzzles:
        nasa_id = puzzle.get("nasaId")
        decision = decisions.get(nasa_id)
        if decision:
            puzzle["rightsReview"] = decision
            applied += 1

    for record in metadata:
        decision = decisions.get(record.get("nasaId"))
        if decision:
            record["rightsReviewStatus"] = decision["status"]
            record["rightsReviewNotes"] = decision["notes"]

    write_json(MANIFEST, puzzles)
    write_json(METADATA, metadata)
    with CSV_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["nasaId", "title", "credit", "status", "notes", "sourceUrl"],
        )
        writer.writeheader()
        by_id = {record["nasaId"]: record for record in metadata}
        for puzzle in puzzles:
            nasa_id = puzzle.get("nasaId")
            if not nasa_id:
                continue
            record = by_id[nasa_id]
            writer.writerow(
                {
                    "nasaId": nasa_id,
                    "title": puzzle["title"],
                    "credit": puzzle["credit"],
                    "status": puzzle["rightsReview"]["status"],
                    "notes": puzzle["rightsReview"]["notes"],
                    "sourceUrl": record["nasaRecordUrl"],
                }
            )
    print(f"Applied {applied} explicit NASA review decisions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
