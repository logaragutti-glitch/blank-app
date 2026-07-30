import type { AuditedEntity } from "./tenant";

export type InspirationImageStatus = "PENDING" | "ANALYZED" | "FAILED";

/** Structured output of Agente 2 / Vision AI (04-ai-bible.md). */
export interface VisionTags {
  flowers?: string[];
  furniture?: string[];
  colors?: string[];
  styles?: string[];
  architecture?: string[];
  lighting?: string[];
  textiles?: string[];
  trends?: string[];
  [key: string]: unknown;
}

export interface InspirationImage extends AuditedEntity {
  eventId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: InspirationImageStatus;
  visionTags: VisionTags | null;
  visionDescription: string | null;
  processingError: string | null;
}
