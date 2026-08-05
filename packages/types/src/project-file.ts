import type { AuditedEntity } from "./tenant";

/**
 * A generic file attached to an Event (contract, floor plan, supplier
 * quote, etc.) — separate from InspirationImage, which carries vision
 * analysis/embedding for decoration photos that this doesn't need.
 */
export interface ProjectFile extends AuditedEntity {
  eventId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  /**
   * A time-limited signed GET URL for `storageKey`, computed fresh on
   * every read (never persisted, since a signed URL expires but the S3
   * key does not) — same pattern as InspirationImage.imageUrl. Optional
   * because it's only present when the API attaches it.
   */
  fileUrl?: string;
}
