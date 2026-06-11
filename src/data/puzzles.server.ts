import "server-only";

import rawPuzzles from "./nasa-puzzles.generated.json";
import type { AstroPuzzle, PublicCredit, PublicPuzzle } from "@/src/types/puzzle";
import { publicTargetGeometry } from "@/src/lib/game/targetGeometry";

const puzzles = rawPuzzles as AstroPuzzle[];

export function getApprovedPuzzles(): AstroPuzzle[] {
  return puzzles.filter((puzzle) => puzzle.rightsReview.status === "approved");
}

export function getPuzzleById(id: string): AstroPuzzle | undefined {
  return getApprovedPuzzles().find((puzzle) => puzzle.id === id);
}

export function toPublicPuzzle(puzzle: AstroPuzzle): PublicPuzzle {
  return {
    id: puzzle.id,
    imageSrc: puzzle.imageSrc,
    width: puzzle.width,
    height: puzzle.height,
    collectionLabel: puzzle.nasaId ? "Cosmic Archive" : "Studio Observatory",
    maxAttempts: 5,
    ...publicTargetGeometry(puzzle),
  };
}

export function getPublicCredits(): PublicCredit[] {
  return getApprovedPuzzles().map(
    ({
      id,
      imageSrc,
      title,
      credit,
      sourceLabel,
      sourceUrl,
      nasaId,
      rightsReview,
    }) => ({
      id,
      imageSrc,
      title,
      credit,
      sourceLabel,
      sourceUrl,
      nasaId,
      rightsReview,
    }),
  );
}

export function getPuzzlesForCuration(): AstroPuzzle[] {
  if (process.env.NODE_ENV === "production") return [];
  return puzzles;
}
