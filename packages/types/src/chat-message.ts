export type ChatMessageRole = "USER" | "ASSISTANT";

/**
 * One turn in the Chat com a EVE transcript for a project (Bucket C).
 * Append-only — no update/delete, no soft delete/versioning — a sent
 * message is a record of what was said, never edited afterwards (same
 * reasoning as PostEventFeedback, simplified further since even that has
 * an upsert; this doesn't).
 */
export interface ChatMessage {
  id: string;
  tenantId: string;
  organizationId: string;
  eventId: string;
  createdAt: string;
  createdBy: string | null;
  role: ChatMessageRole;
  content: string;
}
