"use client";

import Image from "next/image";
import { forwardRef, type CSSProperties } from "react";
import type { HslColor, PublicPuzzle } from "@/src/types/puzzle";
import { regionBounds, RESTORATION_PATCH_FRAC, restorationBrightness } from "@/src/lib/game/targetGeometry";

type Props = {
  puzzle: PublicPuzzle;
  guess: HslColor;
  onOpenZoom: () => void;
};

export const TargetRegionInspector = forwardRef<HTMLButtonElement, Props>(
  function TargetRegionInspector({ puzzle, guess, onOpenZoom }, ref) {
    const bounds = regionBounds(puzzle.inspectionRegion);
    const sampleX = ((puzzle.samplePoint.x - bounds.left) / bounds.width) * 100;
    const sampleY = ((puzzle.samplePoint.y - bounds.top) / bounds.height) * 100;
    const cropAspect =
      (bounds.width * puzzle.width) / (bounds.height * puzzle.height);

    const patchNorm = RESTORATION_PATCH_FRAC * Math.min(puzzle.width, puzzle.height) / puzzle.width;
    const cropPatchW = (patchNorm / bounds.width) * 100;
    const brightness = restorationBrightness(guess.l);

    return (
      <section className="target-inspector" aria-labelledby="target-inspector-title">
        <div className="target-inspector-heading">
          <div>
            <p className="eyebrow">Restoration preview</p>
            <h2 id="target-inspector-title">Match the surroundings</h2>
          </div>
        </div>
        <button
          ref={ref}
          className="target-crop"
          style={{ aspectRatio: cropAspect }}
          onClick={onOpenZoom}
          aria-label="Open larger image inspector"
        >
          <span
            className="target-crop-canvas"
            style={{
              left: `${-(bounds.left / bounds.width) * 100}%`,
              top: `${-(bounds.top / bounds.height) * 100}%`,
              width: `${100 / bounds.width}%`,
              height: `${100 / bounds.height}%`,
            }}
          >
            <Image
              src={puzzle.imageSrc}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 360px"
              className="target-crop-image"
              draggable={false}
            />
          </span>
          <span
            className="crop-restoration-patch restoration-effect"
            style={{
              left: `${sampleX}%`,
              top: `${sampleY}%`,
              width: `${cropPatchW}%`,
              "--guess-color": `hsl(${guess.h} ${guess.s}% ${guess.l}%)`,
              "--brightness": brightness,
            } as CSSProperties}
          />
        </button>
      </section>
    );
  },
);
