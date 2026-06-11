"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { RevealData } from "@/src/types/game";
import type { HslColor, PublicPuzzle } from "@/src/types/puzzle";
import { restorationBrightness } from "@/src/lib/game/targetGeometry";

type Props = {
  puzzle: PublicPuzzle;
  guess: HslColor;
  reveal?: RevealData;
};

export function AstroImageCard({ puzzle, guess, reveal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0, left: 0, top: 0 });
  const [failed, setFailed] = useState(false);

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
        {!failed && bounds.width > 0 && !reveal ? (
          <>
            <div
              className="restoration-overlay"
              style={{
                position: "absolute",
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
                "--guess-color": `hsl(${guess.h} ${guess.s}% ${guess.l}%)`,
                WebkitMaskImage: puzzle.maskSrc ? `url(${puzzle.maskSrc})` : "none",
                maskImage: puzzle.maskSrc ? `url(${puzzle.maskSrc})` : "none",
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                pointerEvents: "none",
              } as CSSProperties}
              aria-hidden="true"
            >
              <img
                src={puzzle.imageSrc}
                className="restoration-base"
                style={{
                  width: "100%",
                  height: "100%",
                  filter: `grayscale(1) brightness(${brightness}) contrast(1.05)`,
                }}
                alt=""
              />
              <i className="restoration-tint" aria-hidden="true" />
            </div>
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
      </div>
      <p className="image-instruction">
        Restore the desaturated patch by adjusting the color sliders below.
      </p>
    </section>
  );
}
