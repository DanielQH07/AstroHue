"use client";

import Image from "next/image";
import { ExternalLink, Share2 } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { GuessRecord, RevealData } from "@/src/types/game";
import type { HslColor, PublicPuzzle } from "@/src/types/puzzle";
import { RESTORATION_PATCH_FRAC, restorationBrightness } from "@/src/lib/game/targetGeometry";

function ResultImage({
  puzzle,
  guess,
  label,
  masked,
}: {
  puzzle: PublicPuzzle;
  guess: HslColor;
  label: string;
  masked: boolean;
}) {
  const patchPct = RESTORATION_PATCH_FRAC * Math.min(puzzle.width, puzzle.height) / puzzle.width * 100;
  const brightness = restorationBrightness(guess.l);
  return (
    <div className="result-image-compare">
      <span>{label}</span>
      <div className="result-image-frame" style={{ aspectRatio: puzzle.width / puzzle.height }}>
        <Image src={puzzle.imageSrc} alt="" fill sizes="320px" className="challenge-image" />
        {masked ? (
          <div
            className="result-restoration-patch restoration-effect"
            style={{
              left: `${puzzle.samplePoint.x * 100}%`,
              top: `${puzzle.samplePoint.y * 100}%`,
              width: `${patchPct}%`,
              "--guess-color": `hsl(${guess.h} ${guess.s}% ${guess.l}%)`,
              "--brightness": brightness,
            } as CSSProperties}
          />
        ) : null}
      </div>
    </div>
  );
}

export function ResultPanel({
  won,
  attempt,
  reveal,
  closest,
  history,
  puzzle,
  finalGuess,
  onNext,
}: {
  won: boolean;
  attempt: number;
  reveal: RevealData;
  closest: GuessRecord;
  history: GuessRecord[];
  puzzle: PublicPuzzle;
  finalGuess: HslColor;
  onNext: () => void;
}) {
  const [shareStatus, setShareStatus] = useState("");
  const share = async () => {
    const text = [
      `ASTROHUE ${won ? attempt : "X"}/5`,
      ...history.map((item) =>
        [item.feedback.hue.symbol, item.feedback.saturation.symbol, item.feedback.lightness.symbol].join(""),
      ),
    ].join("\n");
    try {
      if (typeof navigator.share === "function") await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setShareStatus(
        typeof navigator.share === "function"
          ? "Share sheet opened."
          : "Result copied.",
      );
    } catch {
      setShareStatus("Sharing was unavailable. Try copying again.");
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onNext();
      }}
      title={won ? "You found the hidden color" : "The color has been revealed"}
      description={won ? `Solved in ${attempt} ${attempt === 1 ? "guess" : "guesses"}` : `Your closest score was ${closest.score}/100.`}
      className="result-dialog"
    >
      <div className="result-scoreline">
        <strong>{closest.score}</strong>
        <span>{won ? "Matched" : "Best guess"} · {history.length}/5 guesses</span>
      </div>
      <div className="result-image-grid">
        <ResultImage puzzle={puzzle} guess={finalGuess} label="Your image" masked />
        <ResultImage puzzle={puzzle} guess={finalGuess} label="Original image" masked={false} />
      </div>
      <div className="comparison compact">
        <div>
          <span>Your closest color</span>
          <i style={{ background: closest.hex }} />
          <strong>{closest.hex}</strong>
          <small>H {closest.guess.h} · S {closest.guess.s} · L {closest.guess.l}</small>
        </div>
        <div>
          <span>Target color</span>
          <i style={{ background: reveal.targetHex }} />
          <strong>{reveal.targetHex}</strong>
          <small>H {reveal.target.h} · S {reveal.target.s} · L {reveal.target.l}</small>
        </div>
      </div>
      <article className="result-story compact">
        <div>
          <p className="eyebrow">Source</p>
          <h3>{reveal.title}</h3>
          <p>{reveal.description}</p>
        </div>
        <dl>
          <div><dt>Credit</dt><dd>{reveal.credit}</dd></div>
          <div><dt>Source</dt><dd><a href={reveal.sourceUrl} target="_blank" rel="noopener noreferrer">{reveal.sourceLabel} <ExternalLink size={14} /></a></dd></div>
        </dl>
      </article>
      <div className="result-actions">
        <Button onClick={onNext}>Next challenge</Button>
        <Button variant="secondary" onClick={share}><Share2 size={18} /> Share result</Button>
      </div>
      <p className="status-message" role="status">{shareStatus}</p>
    </Dialog>
  );
}
