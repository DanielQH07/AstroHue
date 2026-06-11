import { NextResponse } from "next/server";
import { getApprovedPuzzles, toPublicPuzzle } from "@/src/data/puzzles.server";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  const puzzles = getApprovedPuzzles()
    .filter((puzzle) => puzzle.imageSrc.startsWith("/astro/nasa/"))
    .slice(0, 13)
    .map(toPublicPuzzle);

  return NextResponse.json({ puzzles }, { headers });
}
