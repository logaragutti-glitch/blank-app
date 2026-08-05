import type { ChatMessage, ChatMessageRole } from "@eve-os/types";

export interface CreateChatMessageInput {
  tenantId: string;
  organizationId: string;
  eventId: string;
  role: ChatMessageRole;
  content: string;
  createdBy: string | null;
}

export abstract class ChatMessageRepository {
  /** Oldest first — the natural reading order of a transcript. */
  abstract findByEvent(eventId: string): Promise<ChatMessage[]>;
  abstract create(input: CreateChatMessageInput): Promise<ChatMessage>;
}
