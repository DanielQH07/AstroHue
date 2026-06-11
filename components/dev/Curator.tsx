"use client";

import { Clipboard, Crosshair } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { rgbToHex, rgbToHsl } from "@/src/lib/color/conversions";
import type { AstroPuzzle, HslColor, TargetPoint } from "@/src/types/puzzle";

type Sample = {
  target: HslColor;
  targetHex: string;
  targetPoint: TargetPoint;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function Curator({ puzzles }: { puzzles: AstroPuzzle[] }) {
  const [selectedId, setSelectedId] = useState(puzzles[0]?.id ?? "");
  const selected = useMemo(
    () => puzzles.find((puzzle) => puzzle.id === selectedId) ?? puzzles[0],
    [puzzles, selectedId],
  );
  const [sample, setSample] = useState<Sample | undefined>();
  const [copyStatus, setCopyStatus] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);

  if (!selected) return <p>No puzzle records are available.</p>;
  const preview = sample ?? {
    target: selected.target,
    targetHex: selected.targetHex,
    targetPoint: selected.targetPoint,
  };

  function sampleImage(event: React.MouseEvent<HTMLImageElement>) {
    const image = imageRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) return;
    const rect = image.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(image, 0, 0);
    const centerX = Math.round(x * image.naturalWidth);
    const centerY = Math.round(y * image.naturalHeight);
    const radius = 15;
    const left = Math.max(0, centerX - radius);
    const top = Math.max(0, centerY - radius);
    const width = Math.min(image.naturalWidth - left, radius * 2 + 1);
    const height = Math.min(image.naturalHeight - top, radius * 2 + 1);
    const pixels = context.getImageData(left, top, width, height).data;
    const red: number[] = [];
    const green: number[] = [];
    const blue: number[] = [];
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] === 0) continue;
      red.push(pixels[index]);
      green.push(pixels[index + 1]);
      blue.push(pixels[index + 2]);
    }
    const rgb = { r: median(red), g: median(green), b: median(blue) };
    setSample({
      target: rgbToHsl(rgb),
      targetHex: rgbToHex(rgb),
      targetPoint: { x, y },
    });
    setCopyStatus("");
  }

  const corrected = {
    ...selected,
    target: preview.target,
    targetHex: preview.targetHex,
    targetPoint: preview.targetPoint,
  };

  return (
    <div className="curator">
      <label className="curator-select">
        Puzzle
        <select
          value={selected.id}
          onChange={(event) => {
            setSelectedId(event.target.value);
            setSample(undefined);
          }}
        >
          {puzzles.map((puzzle) => (
            <option value={puzzle.id} key={puzzle.id}>
              {puzzle.title} ({puzzle.rightsReview.status})
            </option>
          ))}
        </select>
      </label>

      <div className="curator-grid">
        <section>
          <p className="eyebrow">Click to sample a 31×31 patch</p>
          <div className="curator-image">
            {/* A native image keeps canvas sampling straightforward in this dev-only tool. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={selected.imageSrc}
              alt={selected.title}
              onClick={sampleImage}
            />
            <span
              style={{
                left: `${preview.targetPoint.x * 100}%`,
                top: `${preview.targetPoint.y * 100}%`,
              }}
            >
              <Crosshair aria-hidden="true" />
            </span>
          </div>
        </section>

        <aside className="curator-panel">
          <p className="eyebrow">Sample preview</p>
          <div className="curator-sample">
            <i style={{ background: preview.targetHex }} />
            <div>
              <strong>{preview.targetHex}</strong>
              <span>
                H {preview.target.h} · S {preview.target.s} · L {preview.target.l}
              </span>
              <small>
                x {preview.targetPoint.x.toFixed(4)} · y{" "}
                {preview.targetPoint.y.toFixed(4)}
              </small>
            </div>
          </div>

          <h2>Extracted candidates</h2>
          <div className="candidate-list">
            {selected.paletteCandidates?.map((candidate) => (
              <button
                key={`${candidate.hex}-${candidate.score}`}
                onClick={() =>
                  setSample({
                    target: { h: candidate.h, s: candidate.s, l: candidate.l },
                    targetHex: candidate.hex,
                    targetPoint: preview.targetPoint,
                  })
                }
              >
                <i style={{ background: candidate.hex }} />
                <span>{candidate.hex}</span>
                <small>{candidate.score.toFixed(3)}</small>
              </button>
            ))}
          </div>

          <div className="curator-comparison">
            <div>
              <span>Current</span>
              <i style={{ background: selected.targetHex }} />
              <strong>{selected.targetHex}</strong>
            </div>
            <div>
              <span>Preview</span>
              <i style={{ background: preview.targetHex }} />
              <strong>{preview.targetHex}</strong>
            </div>
          </div>

          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  JSON.stringify(corrected, null, 2),
                );
                setCopyStatus("Corrected puzzle JSON copied.");
              } catch {
                setCopyStatus("Clipboard unavailable.");
              }
            }}
          >
            <Clipboard size={18} /> Copy corrected record
          </Button>
          <p className="status-message" role="status">{copyStatus}</p>
        </aside>
      </div>
    </div>
  );
}
