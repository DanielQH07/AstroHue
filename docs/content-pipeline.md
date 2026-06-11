# Content Pipeline

## Inputs

The downloader uses only NASA Image and Video Library API endpoints:

- `/search`
- `/asset/{nasa_id}`

Queries are diversified across deep space, planetary, lunar, solar, and Earth
themes. Metadata suggesting illustrations, diagrams, branding, ceremonies, or
other unsuitable media is rejected before asset download.

## Processing

Each candidate receives timeout/retry handling, content-type validation,
corruption checks, minimum-resolution checks, EXIF correction, ID/hash
deduplication, aspect-preserving resize, and local WebP conversion.

Target extraction uses Pillow adaptive quantization on a small working image.
Candidate scoring considers frequency, saturation, useful lightness, and noise
rejection. A representative point is selected, then the final RGB/HSL target is
derived only from a small local `sampleRadius` patch. Nearly black, nearly
white, and low-saturation pixels are rejected; the dominant local color cluster
must cover most of the valid patch. The larger `inspectionRegion` is generated
only for player context and is not averaged into the answer.

Existing records were migrated by treating the old `targetPoint` as
`samplePoint`, adding a small normalized `sampleRadius`, and deriving a clamped
inspection region around that point. These migrated records retain their source
metadata and include a rights-review note that manual sample-patch review is
required.

## Outputs And Review

The script writes images, the private game manifest, detailed source metadata,
and a CSV review ledger atomically where practical. Every new record is
`pending`. The game loads only `approved` records.

Run:

```text
npm run content:nasa
npm run content:validate
```

Manual review must verify source identity, photographer/center credits,
third-party copyright signals, identifiable persons where relevant, and any
record-specific restrictions before approval.
