import type { AuditedEntity } from "./tenant";

/** Intensity scores per dimension (0-10), e.g. { Luxuoso: 8, Natural: 7.8 }. Never binary categories. */
export type StyleDimensionScores = Record<string, number>;

export interface EventStyle extends AuditedEntity {
  name: string;
  description: string | null;
  dimensionScores: StyleDimensionScores;
  paletteColors: string[];
  furnitureNotes: string[];
  loungeNotes: string[];
}
