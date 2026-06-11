import json
from pathlib import Path

# Filter generated JSON
generated_path = Path("src/data/nasa-puzzles.generated.json")
puzzles = json.loads(generated_path.read_text(encoding="utf-8"))

to_remove = ["PIA13762"]

puzzles = [p for p in puzzles if p.get("nasaId") not in to_remove]
while len(puzzles) > 18:
    puzzles.pop()

generated_path.write_text(json.dumps(puzzles, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Filtered generated json to {len(puzzles)} items.")

# Filter source metadata to match
metadata_path = Path("data/nasa-source-metadata.json")
meta = json.loads(metadata_path.read_text(encoding="utf-8"))

valid_ids = {p["nasaId"] for p in puzzles}
meta = [m for m in meta if m.get("nasaId") in valid_ids]

metadata_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Filtered source metadata to {len(meta)} items.")
