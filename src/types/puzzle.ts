export type HslColor = {
  h: number;
  s: number;
  l: number;
};

export type TargetPoint = {
  x: number;
  y: number;
};

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type NormalizedRegion = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export type PuzzleTarget = {
  samplePoint: NormalizedPoint;
  sampleRadius: number;
  inspectionRegion: NormalizedRegion;
  target: HslColor;
  targetHex: string;
};

export type RightsReview = {
  status: "pending" | "approved" | "rejected";
  notes: string;
};

export type AstroPuzzle = {
  id: string;
  imageSrc: string;
  title: string;
  description: string;
  credit: string;
  sourceLabel: string;
  sourceUrl: string;
  nasaId?: string;
  dateCreated?: string;
  center?: string;
  keywords?: string[];
  width: number;
  height: number;
  target: HslColor;
  targetHex: string;
  targetPoint: TargetPoint;
  samplePoint?: NormalizedPoint;
  sampleRadius?: number;
  inspectionRegion?: NormalizedRegion;
  imageSha256: string;
  paletteCandidates?: Array<HslColor & { hex: string; score: number }>;
  rightsReview: RightsReview;
};

export type PublicPuzzle = Pick<
  AstroPuzzle,
  "id" | "imageSrc" | "width" | "height"
> & {
  collectionLabel: string;
  maxAttempts: 5;
  samplePoint: NormalizedPoint;
  sampleRadius: number;
  inspectionRegion: NormalizedRegion;
};

export type PublicCredit = Pick<
  AstroPuzzle,
  | "id"
  | "imageSrc"
  | "title"
  | "credit"
  | "sourceLabel"
  | "sourceUrl"
  | "nasaId"
  | "rightsReview"
>;
