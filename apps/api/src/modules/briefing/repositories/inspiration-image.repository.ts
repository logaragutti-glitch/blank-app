import type { InspirationImage, InspirationImageStatus, VisionTags } from "@eve-os/types";

export interface CreateInspirationImageInput {
  tenantId: string;
  organizationId: string;
  eventId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UpdateInspirationImageAnalysisInput {
  status: InspirationImageStatus;
  visionTags?: VisionTags | null;
  visionDescription?: string | null;
  processingError?: string | null;
}

export abstract class InspirationImageRepository {
  abstract create(input: CreateInspirationImageInput): Promise<InspirationImage>;
  abstract findById(organizationId: string, id: string): Promise<InspirationImage | null>;
  abstract findByEvent(organizationId: string, eventId: string): Promise<InspirationImage[]>;
  abstract updateAnalysis(
    id: string,
    input: UpdateInspirationImageAnalysisInput,
  ): Promise<InspirationImage>;
  /** Stores the OpenAI embedding of `visionDescription` for semantic search (pgvector). */
  abstract setEmbedding(id: string, embedding: number[]): Promise<void>;
}
