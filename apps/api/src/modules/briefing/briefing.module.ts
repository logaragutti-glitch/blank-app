import { Module } from "@nestjs/common";
import { AnthropicVisionAnalysisProvider } from "./ai/anthropic-vision-analysis.provider";
import { EmbeddingPort } from "./ai/embedding.port";
import { OpenAiEmbeddingProvider } from "./ai/openai-embedding.provider";
import { VisionAnalysisPort } from "./ai/vision-analysis.port";
import { BriefingController } from "./briefing.controller";
import { ClientRepository } from "./repositories/client.repository";
import { EventRepository } from "./repositories/event.repository";
import { InspirationImageRepository } from "./repositories/inspiration-image.repository";
import { PrismaClientRepository } from "./repositories/prisma-client.repository";
import { PrismaEventRepository } from "./repositories/prisma-event.repository";
import { PrismaInspirationImageRepository } from "./repositories/prisma-inspiration-image.repository";

@Module({
  controllers: [BriefingController],
  providers: [
    { provide: ClientRepository, useClass: PrismaClientRepository },
    { provide: EventRepository, useClass: PrismaEventRepository },
    { provide: InspirationImageRepository, useClass: PrismaInspirationImageRepository },
    { provide: VisionAnalysisPort, useClass: AnthropicVisionAnalysisProvider },
    { provide: EmbeddingPort, useClass: OpenAiEmbeddingProvider },
  ],
  exports: [ClientRepository, EventRepository, InspirationImageRepository],
})
export class BriefingModule {}
