import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { CreativeModule } from "../creative/creative.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { AnthropicProductionPlanProvider } from "./ai/anthropic-production-plan.provider";
import { ProductionPlanPort } from "./ai/production-plan.port";
import { ProductionController } from "./production.controller";
import { PrismaProductionPlanRepository } from "./repositories/prisma-production-plan.repository";
import { ProductionPlanRepository } from "./repositories/production-plan.repository";

@Module({
  imports: [BriefingModule, CreativeModule, KnowledgeGraphModule],
  controllers: [ProductionController],
  providers: [
    { provide: ProductionPlanRepository, useClass: PrismaProductionPlanRepository },
    { provide: ProductionPlanPort, useClass: AnthropicProductionPlanProvider },
  ],
})
export class ProductionModule {}
