"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { PublicPuzzle } from "@/src/types/puzzle";

export function ChallengeGrid({
  puzzles,
  scores,
  onSelect,
}: {
  puzzles: PublicPuzzle[];
  scores: Record<string, number>;
  onSelect: (puzzle: PublicPuzzle) => void;
}) {


  return (
    <section className="challenge-picker" aria-labelledby="challenge-picker-title">
      <div className="section-heading">
        <p className="eyebrow">Daily archive</p>
        <h2 id="challenge-picker-title">Choose a challenge</h2>
      </div>
      <div className="challenge-grid">
        {puzzles.map((puzzle, index) => (
          <button
            className="challenge-tile"
            key={puzzle.id}
            onClick={() => onSelect(puzzle)}
            aria-label={`Start challenge ${index + 1}`}
          >
            <Image
              src={puzzle.imageSrc}
              alt=""
              fill
              sizes="(max-width: 767px) 45vw, 180px"
              className="challenge-thumb"
            />
            <span>
              <b>{String(index + 1).padStart(2, "0")}</b>
              {scores[puzzle.id] !== undefined ? `Score: ${scores[puzzle.id]}` : "Play"}
              <Play size={14} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
