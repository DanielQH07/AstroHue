"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { RevealData } from "@/src/types/game";
import type { HslColor, PublicPuzzle } from "@/src/types/puzzle";
import { RESTORATION_PATCH_FRAC, restorationBrightness } from "@/src/lib/game/targetGeometry";

type Props = {
  puzzle: PublicPuzzle;
  guess: HslColor;
  reveal?: RevealData;
  onInspect: () => void;
  onZoom: () => void;
};

export function AstroImageCard({ puzzle, guess, reveal, onInspect, onZoom }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0, left: 0, top: 0 });
  const [failed, setFailed] = useState(false);

  const minDim = Math.min(bounds.width, bounds.height);
  const patchSize = minDim * RESTORATION_PATCH_FRAC;
  const cx = bounds.left + bounds.width * puzzle.samplePoint.x;
  const cy = bounds.top + bounds.height * puzzle.samplePoint.y;
  const brightness = restorationBrightness(guess.l);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const calculate = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const scale = Math.min(width / puzzle.width, height / puzzle.height);
      const renderedWidth = puzzle.width * scale;
      const renderedHeight = puzzle.height * scale;
      setBounds({
        width: renderedWidth,
        height: renderedHeight,
        left: (width - renderedWidth) / 2,
        top: (height - renderedHeight) / 2,
      });
    };
    const observer = new ResizeObserver(calculate);
    observer.observe(container);
    calculate();
    return () => observer.disconnect();
  }, [puzzle]);

  return (
    <section className="image-card" aria-label="Astronomy image">
      <div ref={containerRef} className="image-stage">
        {failed ? (
          <div className="image-error">
            <strong>The image could not be displayed.</strong>
            <span>Start another image to keep exploring.</span>
          </div>
        ) : (
          <Image
            src={puzzle.imageSrc}
            alt={
              reveal
                ? `${reveal.title}, the astronomy image used for this color challenge`
                : "Featured astronomy image for the current color challenge"
            }
            fill
            priority
            sizes="(max-width: 767px) 100vw, 58vw"
            className="challenge-image"
            onError={() => setFailed(true)}
          />
        )}
        {!failed && patchSize > 0 && !reveal ? (
          <>
            <div
              className="restoration-ring"
              style={{ left: cx, top: cy, width: patchSize + 16, height: patchSize + 16 }}
              aria-hidden="true"
            />
            <button
              className="restoration-patch restoration-effect"
              style={{
                left: cx,
                top: cy,
                width: patchSize,
                height: patchSize,
                "--guess-color": `hsl(${guess.h} ${guess.s}% ${guess.l}%)`,
                "--brightness": brightness,
              } as CSSProperties}
              onClick={onInspect}
              aria-label="Desaturated region — click to inspect closer"
            />
          </>
        ) : null}
        {reveal ? (
          <div
            className="target-marker"
            style={{
              left: bounds.left + bounds.width * reveal.targetPoint.x,
              top: bounds.top + bounds.height * reveal.targetPoint.y,
            }}
            role="img"
            aria-label="Color sampled here"
          >
            <span />
            <b>Color sampled here</b>
          </div>
        ) : null}
        <button className="zoom-button" onClick={onZoom}>
          <Maximize2 size={18} aria-hidden="true" /> Zoom image
        </button>
      </div>
      <p className="image-instruction">
        Restore the desaturated patch by adjusting the color sliders below.
      </p>
    </section>
  );
}
