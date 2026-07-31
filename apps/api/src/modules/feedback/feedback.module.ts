import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { FeedbackController } from "./feedback.controller";
import { PrismaPostEventFeedbackRepository } from "./repositories/prisma-post-event-feedback.repository";
import { PostEventFeedbackRepository } from "./repositories/post-event-feedback.repository";

@Module({
  imports: [BriefingModule, KnowledgeGraphModule],
  controllers: [FeedbackController],
  providers: [{ provide: PostEventFeedbackRepository, useClass: PrismaPostEventFeedbackRepository }],
  exports: [PostEventFeedbackRepository],
})
export class FeedbackModule {}
