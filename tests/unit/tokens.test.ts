import { describe, expect, it } from "vitest";
import {
  createRoundToken,
  TokenError,
  verifyRoundToken,
} from "@/src/lib/game/tokens.server";

describe("round tokens", () => {
  it("round-trips valid state and increments attempts in new tokens", () => {
    const token = createRoundToken("nasa-pia08516", 2, 100);
    expect(verifyRoundToken(token, 101)).toMatchObject({
      puzzleId: "nasa-pia08516",
      attempt: 2,
      iat: 100,
    });
  });

  it("rejects invalid signatures and malformed data", () => {
    const token = createRoundToken("nasa-pia08516");
    expect(() => verifyRoundToken(`${token}x`)).toThrow(TokenError);
    expect(() => verifyRoundToken("bad")).toThrow(TokenError);
  });

  it("rejects expired tokens", () => {
    const token = createRoundToken("nasa-pia08516", 0, 100);
    expect(() => verifyRoundToken(token, 100 + 24 * 60 * 60 + 1)).toThrow(
      /expired/i,
    );
  });
});
