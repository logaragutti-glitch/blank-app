import type { AuditedEntity } from "./tenant";

export type EventType =
  | "WEDDING"
  | "CORPORATE"
  | "KIDS"
  | "DESTINATION"
  | "VENUE_MANAGED"
  | "HOTEL"
  | "CONVENTION";

export type EventStatus =
  | "DRAFT"
  | "BRIEFING_CAPTURED"
  | "DIAGNOSED"
  | "PROPOSED"
  | "APPROVED"
  | "IN_PRODUCTION"
  | "COMPLETED"
  | "CANCELLED";

/** GENOME aggregate root — EVE Foundation Artigo 1 (01-constitution.md). */
export interface Event extends AuditedEntity {
  type: EventType;
  status: EventStatus;
  clientId: string;
  venueId: string;
  guestsExpected: number | null;
  ceremonyDateTime: string | null;
  budgetAmount: number | null;
  /** Emotional DNA percentages, e.g. { Romance: 94, Elegancia: 91 }. */
  dnaScores: Record<string, number> | null;
  /** GENOME dimensions not yet normalized into their own tables. */
  genome: unknown;
}
