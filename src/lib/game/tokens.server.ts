import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;
const DEVELOPMENT_SECRET = "astrohue-development-only-fallback-secret";
let warned = false;

export type RoundTokenPayload = {
  v: 1;
  puzzleId: string;
  attempt: number;
  nonce: string;
  iat: number;
  exp: number;
};

export class TokenError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid" | "expired" | "configuration",
  ) {
    super(message);
  }
}

function getSecret(): string {
  const secret = process.env.ASTROHUE_ROUND_SECRET;
  if (secret?.length && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new TokenError(
      "Round service is not configured.",
      "configuration",
    );
  }
  if (!warned) {
    console.warn(
      "[AstroHue] Using a development-only round secret. Set ASTROHUE_ROUND_SECRET.",
    );
    warned = true;
  }
  return DEVELOPMENT_SECRET;
}

function encode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createRoundToken(
  puzzleId: string,
  attempt = 0,
  now = Math.floor(Date.now() / 1000),
): string {
  const payload: RoundTokenPayload = {
    v: 1,
    puzzleId,
    attempt,
    nonce: randomBytes(12).toString("base64url"),
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyRoundToken(
  token: string,
  now = Math.floor(Date.now() / 1000),
): RoundTokenPayload {
  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) {
    throw new TokenError("Malformed round token.", "invalid");
  }
  const expected = Buffer.from(sign(encodedPayload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new TokenError("Invalid round token.", "invalid");
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<RoundTokenPayload>;
    if (
      payload.v !== 1 ||
      typeof payload.puzzleId !== "string" ||
      !Number.isInteger(payload.attempt) ||
      typeof payload.nonce !== "string" ||
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp)
    ) {
      throw new TokenError("Malformed round token.", "invalid");
    }
    if ((payload.exp as number) < now) {
      throw new TokenError("Round token has expired.", "expired");
    }
    return payload as RoundTokenPayload;
  } catch (error) {
    if (error instanceof TokenError) throw error;
    throw new TokenError("Malformed round token.", "invalid");
  }
}
