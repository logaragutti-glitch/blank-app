import { Module } from "@nestjs/common";
import { AnthropicVisionAnalysisProvider } from "./ai/anthropic-vision-analysis.provider";
import { VisionAnalysisPort } from "./ai/vision-analysis.port";
import { BriefingController } from "./briefing.controller";
import { ClientsController } from "./clients.controller";
import { ClientRepository } from "./repositories/client.repository";
import { EventRepository } from "./repositories/event.repository";
import { InspirationImageRepository } from "./repositories/inspiration-image.repository";
import { PrismaClientRepository } from "./repositories/prisma-client.repository";
import { PrismaEventRepository } from "./repositories/prisma-event.repository";
import { PrismaInspirationImageRepository } from "./repositories/prisma-inspiration-image.repository";

// EmbeddingPort comes from the global AiModule (see infrastructure/ai) —
// it's shared with the Knowledge Graph's EventStyle semantic search, not
// owned by Briefing specifically.
@Module({
  controllers: [BriefingController, ClientsController],
  providers: [
    { provide: ClientRepository, useClass: PrismaClientRepository },
    { provide: EventRepository, useClass: PrismaEventRepository },
    { provide: InspirationImageRepository, useClass: PrismaInspirationImageRepository },
    { provide: VisionAnalysisPort, useClass: AnthropicVisionAnalysisProvider },
  ],
  exports: [ClientRepository, EventRepository, InspirationImageRepository],
})
export class BriefingModule {}
