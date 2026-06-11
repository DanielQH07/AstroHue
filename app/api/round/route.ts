import { NextResponse } from "next/server";
import { getApprovedPuzzles, toPublicPuzzle } from "@/src/data/puzzles.server";
import { selectPuzzle } from "@/src/lib/game/selection";
import { createRoundToken, TokenError } from "@/src/lib/game/tokens.server";
import { roundRequestSchema } from "@/src/lib/validation/gameSchemas";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  try {
    const parsed = roundRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid round request." },
        { status: 400, headers },
      );
    }
    const approvedPuzzles = getApprovedPuzzles();
    const configuredFixture = process.env.ASTROHUE_TEST_PUZZLE_ID;
    const fixture = configuredFixture
      ? approvedPuzzles.find((item) => item.id === configuredFixture)
      : undefined;
    const nasaPuzzles = approvedPuzzles.filter((item) =>
      item.imageSrc.startsWith("/astro/nasa/"),
    );
    const playablePuzzles = nasaPuzzles.length > 0 ? nasaPuzzles : approvedPuzzles;
    const requested = parsed.data.puzzleId
      ? playablePuzzles.find((item) => item.id === parsed.data.puzzleId)
      : undefined;
    const puzzle =
      fixture ?? requested ?? selectPuzzle(playablePuzzles, parsed.data.excludeIds);
    return NextResponse.json(
      {
        roundToken: createRoundToken(puzzle.id),
        puzzle: toPublicPuzzle(puzzle),
        initialGuess: { h: 210, s: 50, l: 50 },
      },
      { headers },
    );
  } catch (error) {
    const status =
      error instanceof TokenError && error.code === "configuration" ? 503 : 500;
    return NextResponse.json(
      {
        error:
          status === 503
            ? "The round service is not configured."
            : "A new image could not be loaded.",
      },
      { status, headers },
    );
  }
}
