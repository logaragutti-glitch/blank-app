import type { AuditedEntity } from "./tenant";

export type ClientInteractionType = "CALL" | "MEETING" | "EMAIL" | "WHATSAPP" | "MILESTONE" | "NOTE" | "OTHER";

/**
 * A chronological log entry of real contact with the couple (Timeline de
 * Interações, Bucket C) — separate from Client.additionalDetails, which is
 * a point-in-time snapshot of the briefing questionnaire, not a log over
 * time. occurredAt may differ from createdAt: interactions are often
 * logged after the fact.
 */
export interface ClientInteraction extends AuditedEntity {
  clientId: string;
  type: ClientInteractionType;
  occurredAt: string;
  notes: string;
}
