import type { HslColor, PublicPuzzle, TargetPoint } from "./puzzle";

export type HueFeedback = "correct" | "clockwise" | "counter-clockwise";
export type SaturationFeedback = "correct" | "more-vivid" | "more-muted";
export type LightnessFeedback = "correct" | "lighter" | "darker";
export type FeedbackSymbol = "<" | ">" | "✓";
export type ComponentFeedback<TStatus extends string> = {
  status: TStatus;
  symbol: FeedbackSymbol;
};

export type GuessFeedback = {
  hue: ComponentFeedback<HueFeedback>;
  saturation: ComponentFeedback<SaturationFeedback>;
  lightness: ComponentFeedback<LightnessFeedback>;
};

export type GuessRecord = {
  attempt: number;
  guess: HslColor;
  hex: string;
  score: number;
  feedback: GuessFeedback;
};

export type RoundResponse = {
  roundToken: string;
  puzzle: PublicPuzzle;
  initialGuess: HslColor;
};

export type ChallengesResponse = {
  puzzles: PublicPuzzle[];
};

export type RevealData = {
  target: HslColor;
  targetHex: string;
  targetPoint: TargetPoint;
  title: string;
  description: string;
  credit: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type GuessResponse = {
  attempt: number;
  remainingAttempts: number;
  score: number;
  won: boolean;
  completed: boolean;
  feedback: GuessFeedback;
  nextRoundToken?: string;
  reveal?: RevealData;
};

export type GameStatus =
  | "loading"
  | "selecting"
  | "ready"
  | "submitting"
  | "won"
  | "lost"
  | "error";
