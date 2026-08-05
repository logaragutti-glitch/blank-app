import type { ChatMessage as ChatMessagePrismaModel } from "@prisma/client";
import type { ChatMessage, ChatMessageRole } from "@eve-os/types";

export function toChatMessageDomain(model: ChatMessagePrismaModel): ChatMessage {
  return {
    id: model.id,
    tenantId: model.tenantId,
    organizationId: model.organizationId,
    eventId: model.eventId,
    createdAt: model.createdAt.toISOString(),
    createdBy: model.createdBy,
    role: model.role as ChatMessageRole,
    content: model.content,
  };
}
