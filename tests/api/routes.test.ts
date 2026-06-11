import { beforeEach, describe, expect, it } from "vitest";
import { GET as listChallenges } from "@/app/api/challenges/route";
import { POST as createRound } from "@/app/api/round/route";
import { POST as submitGuess } from "@/app/api/guess/route";

function request(url: string, value: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

describe("game route handlers", () => {
  beforeEach(() => {
    process.env.ASTROHUE_TEST_PUZZLE_ID = "nasa-pia08516";
  });

  it("returns a safe uncached round response", async () => {
    const response = await createRound(request("http://localhost/api/round", { excludeIds: [] }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.puzzle.id).toBe("nasa-pia08516");
    expect(body.puzzle.samplePoint).toEqual({ x: 0.5412, y: 0.6206 });
    expect(body.puzzle.sampleRadius).toBe(0.026);
    expect(body.puzzle.inspectionRegion).toEqual({ centerX: 0.5412, centerY: 0.6206, width: 0.44, height: 0.44 });
    expect(JSON.stringify(body)).not.toContain("targetPoint");
    expect(JSON.stringify(body)).not.toContain("targetHex");
    expect(JSON.stringify(body)).not.toContain("paletteCandidates");
    expect(JSON.stringify(body)).not.toContain('"target"');
  });

  it("returns safe uncached challenge thumbnails", async () => {
    const response = await listChallenges();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.puzzles).toHaveLength(13);
    expect(body.puzzles[0].imageSrc).toMatch(/^\/astro\/nasa\//);
    expect(JSON.stringify(body)).not.toContain("targetPoint");
    expect(JSON.stringify(body)).not.toContain("targetHex");
    expect(JSON.stringify(body)).not.toContain("paletteCandidates");
    expect(JSON.stringify(body)).not.toContain('"target"');
  });

  it("rejects invalid round and guess input", async () => {
    expect((await createRound(request("http://localhost/api/round", { excludeIds: [1] }))).status).toBe(400);
    expect((await submitGuess(request("http://localhost/api/guess", { roundToken: "bad", guess: { h: 400, s: 0, l: 0 } }))).status).toBe(400);
  });

  it("returns feedback without reveal, then reveals on an exact win", async () => {
    const round = await (await createRound(request("http://localhost/api/round", {}))).json();
    const activeResponse = await submitGuess(request("http://localhost/api/guess", {
      roundToken: round.roundToken,
      guess: { h: 0, s: 0, l: 0 },
    }));
    const active = await activeResponse.json();
    expect(active.completed).toBe(false);
    expect(active.score).toEqual(expect.any(Number));
    expect(active.feedback.hue.symbol).toMatch(/[<>✓]/);
    expect(active.reveal).toBeUndefined();
    expect(active.nextRoundToken).toBeTruthy();

    const completeResponse = await submitGuess(request("http://localhost/api/guess", {
      roundToken: active.nextRoundToken,
      guess: { h: 16, s: 77, l: 59 },
    }));
    const complete = await completeResponse.json();
    expect(complete).toMatchObject({ attempt: 2, won: true, completed: true });
    expect(complete.reveal.targetHex).toBe("#E76F44");
    expect(complete.reveal.targetPoint).toEqual({ x: 0.5412, y: 0.6206 });
  });

  it("reveals on the fifth attempt", async () => {
    const round = await (await createRound(request("http://localhost/api/round", {}))).json();
    let token = round.roundToken;
    let result;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      result = await (await submitGuess(request("http://localhost/api/guess", {
        roundToken: token,
        guess: { h: 0, s: 0, l: 0 },
      }))).json();
      token = result.nextRoundToken;
    }
    expect(result).toMatchObject({ attempt: 5, won: false, completed: true });
    expect(result.reveal).toBeTruthy();
  });
});
