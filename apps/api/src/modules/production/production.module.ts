import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { CreativeModule } from "../creative/creative.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { AnthropicBudgetAnalysisProvider } from "./ai/anthropic-budget-analysis.provider";
import { AnthropicProductionPlanProvider } from "./ai/anthropic-production-plan.provider";
import { BudgetAnalysisPort } from "./ai/budget-analysis.port";
import { ProductionPlanPort } from "./ai/production-plan.port";
import { ProductionController } from "./production.controller";
import { BudgetAnalysisRepository } from "./repositories/budget-analysis.repository";
import { PrismaBudgetAnalysisRepository } from "./repositories/prisma-budget-analysis.repository";
import { PrismaProductionPlanRepository } from "./repositories/prisma-production-plan.repository";
import { ProductionPlanRepository } from "./repositories/production-plan.repository";

@Module({
  imports: [BriefingModule, CreativeModule, KnowledgeGraphModule],
  controllers: [ProductionController],
  providers: [
    { provide: ProductionPlanRepository, useClass: PrismaProductionPlanRepository },
    { provide: ProductionPlanPort, useClass: AnthropicProductionPlanProvider },
    { provide: BudgetAnalysisRepository, useClass: PrismaBudgetAnalysisRepository },
    { provide: BudgetAnalysisPort, useClass: AnthropicBudgetAnalysisProvider },
  ],
})
export class ProductionModule {}
