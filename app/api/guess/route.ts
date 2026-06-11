import { NextResponse } from "next/server";
import { getPuzzleById } from "@/src/data/puzzles.server";
import { createFeedback, isWinningFeedback } from "@/src/lib/game/feedback";
import { colorScore } from "@/src/lib/game/scoring";
import {
  createRoundToken,
  TokenError,
  verifyRoundToken,
} from "@/src/lib/game/tokens.server";
import { guessRequestSchema } from "@/src/lib/validation/gameSchemas";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 4096;

export async function POST(request: Request) {
  try {
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body is too large." },
        { status: 413, headers },
      );
    }
    const body = await request.text();
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body is too large." },
        { status: 413, headers },
      );
    }
    const parsedJson = JSON.parse(body) as unknown;
    const parsed = guessRequestSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid guess request." },
        { status: 400, headers },
      );
    }
    const state = verifyRoundToken(parsed.data.roundToken);
    if (state.attempt >= 5) {
      return NextResponse.json(
        { error: "This round is already complete." },
        { status: 409, headers },
      );
    }
    const puzzle = getPuzzleById(state.puzzleId);
    if (!puzzle) {
      return NextResponse.json(
        { error: "This puzzle is no longer available." },
        { status: 404, headers },
      );
    }
    const feedback = createFeedback(parsed.data.guess, puzzle.target);
    const attempt = state.attempt + 1;
    const score = colorScore(parsed.data.guess, puzzle.target);
    const won = isWinningFeedback(feedback);
    const completed = won || attempt === 5;

    return NextResponse.json(
      {
        attempt,
        remainingAttempts: 5 - attempt,
        score,
        won,
        completed,
        feedback,
        ...(completed
          ? {
              reveal: {
                target: puzzle.target,
                targetHex: puzzle.targetHex,
                targetPoint: puzzle.targetPoint,
                title: puzzle.title,
                description: puzzle.description,
                credit: puzzle.credit,
                sourceLabel: puzzle.sourceLabel,
                sourceUrl: puzzle.sourceUrl,
              },
            }
          : { nextRoundToken: createRoundToken(puzzle.id, attempt) }),
      },
      { headers },
    );
  } catch (error) {
    if (error instanceof TokenError) {
      const status = error.code === "configuration" ? 503 : 401;
      return NextResponse.json(
        {
          error:
            error.code === "expired"
              ? "This round expired. Start a new image."
              : error.code === "configuration"
                ? "The round service is not configured."
                : "This round token is invalid.",
        },
        { status, headers },
      );
    }
    return NextResponse.json(
      { error: "The guess could not be checked." },
      { status: 400, headers },
    );
  }
}
