import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { CreativeModule } from "../creative/creative.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { ProjectSuppliersModule } from "../project-suppliers/project-suppliers.module";
import { TasksModule } from "../tasks/tasks.module";
import { TeamModule } from "../team/team.module";
import { AnthropicEveChatProvider } from "./ai/anthropic-eve-chat.provider";
import { EveChatPort } from "./ai/eve-chat.port";
import { ChatController } from "./chat.controller";
import { PrismaChatMessageRepository } from "./repositories/prisma-chat-message.repository";
import { ChatMessageRepository } from "./repositories/chat-message.repository";

// UserRepository comes from the global AuthModule — not imported here.
@Module({
  imports: [BriefingModule, KnowledgeGraphModule, CreativeModule, TasksModule, TeamModule, ProjectSuppliersModule],
  controllers: [ChatController],
  providers: [
    { provide: ChatMessageRepository, useClass: PrismaChatMessageRepository },
    { provide: EveChatPort, useClass: AnthropicEveChatProvider },
  ],
  exports: [ChatMessageRepository],
})
export class ChatModule {}
