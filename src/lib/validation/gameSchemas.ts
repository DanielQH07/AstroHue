import { z } from "zod";

export const hslSchema = z
  .object({
    h: z.number().int().min(0).max(359),
    s: z.number().int().min(0).max(100),
    l: z.number().int().min(0).max(100),
  })
  .strict();

export const roundRequestSchema = z
  .object({
    excludeIds: z.array(z.string().min(1).max(100)).max(100).default([]),
    puzzleId: z.string().min(1).max(100).optional(),
  })
  .strict();

export const guessRequestSchema = z
  .object({
    roundToken: z.string().min(20).max(2048),
    guess: hslSchema,
  })
  .strict();
