import type { AuditedEntity } from "./tenant";

export interface Venue extends AuditedEntity {
  name: string;
  structuralConstraints: string | null;
  ceilingHeightMeters: number | null;
  powerOutlets: number | null;
  guestCapacity: number | null;
  existingFurniture: unknown;
  typicalClimate: string | null;
  /** Derived venue rules, e.g. "cerimônia externa", "iluminação quente". */
  recommendationNotes: string[];
  /** S3 storage keys of real photos of the space (facade, hall, garden...). */
  photoKeys: string[];
  /**
   * Time-limited signed GET URLs for `photoKeys`, computed fresh on every
   * read (never persisted, since a signed URL expires but the S3 key does
   * not) — same pattern as InspirationImage.imageUrl. Optional because
   * it's only present when the API attaches it, and always the same
   * length/order as photoKeys.
   */
  photoUrls?: string[];
}
