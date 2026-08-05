import { Injectable } from "@nestjs/common";
import type { ChatMessage } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toChatMessageDomain } from "../mappers/chat-message.mapper";
import { ChatMessageRepository, type CreateChatMessageInput } from "./chat-message.repository";

@Injectable()
export class PrismaChatMessageRepository implements ChatMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEvent(eventId: string): Promise<ChatMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    });
    return messages.map(toChatMessageDomain);
  }

  async create(input: CreateChatMessageInput): Promise<ChatMessage> {
    const message = await this.prisma.chatMessage.create({
      data: {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        eventId: input.eventId,
        role: input.role,
        content: input.content,
        createdBy: input.createdBy,
      },
    });
    return toChatMessageDomain(message);
  }
}
