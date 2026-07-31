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
}
