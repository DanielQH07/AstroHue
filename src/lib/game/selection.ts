import type { AstroPuzzle } from "@/src/types/puzzle";
import { randomInt } from "node:crypto";

export function selectPuzzle(
  puzzles: AstroPuzzle[],
  excludedIds: string[],
): AstroPuzzle {
  if (puzzles.length === 0) throw new Error("No approved puzzles are available.");
  const excluded = new Set(excludedIds);
  const eligible = puzzles.filter((puzzle) => !excluded.has(puzzle.id));
  const pool = eligible.length > 0 ? eligible : puzzles;
  return pool[randomInt(pool.length)];
}
