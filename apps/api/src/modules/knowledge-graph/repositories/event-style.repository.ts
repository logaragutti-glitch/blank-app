import type { EventStyle, StyleDimensionScores } from "@eve-os/types";

export interface CreateEventStyleInput {
  name: string;
  description: string | null | undefined;
  dimensionScores: StyleDimensionScores;
  paletteColors: string[];
  furnitureNotes: string[];
  loungeNotes: string[];
  createdBy: string | null;
}

export interface UpdateEventStyleInput {
  name?: string;
  description?: string | null;
  dimensionScores?: StyleDimensionScores;
  paletteColors?: string[];
  furnitureNotes?: string[];
  loungeNotes?: string[];
  updatedBy: string | null;
}

export abstract class EventStyleRepository {
  abstract findAll(organizationId: string): Promise<EventStyle[]>;
  abstract findById(organizationId: string, id: string): Promise<EventStyle | null>;
  abstract create(tenantId: string, organizationId: string, input: CreateEventStyleInput): Promise<EventStyle>;
  abstract update(id: string, input: UpdateEventStyleInput): Promise<EventStyle>;
  /** Stores the embedding of this style's textual description (pgvector). */
  abstract setEmbedding(id: string, embedding: number[]): Promise<void>;
  /**
   * Real semantic search via pgvector's `<=>` (cosine distance) operator —
   * only considers styles that already have an embedding backfilled.
   * Falls back to an empty array (never throws) when none do, so callers
   * can gracefully fall back to `findAll`.
   */
  abstract findSimilarByEmbedding(
    organizationId: string,
    embedding: number[],
    limit: number,
  ): Promise<EventStyle[]>;
}
