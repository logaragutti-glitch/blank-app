import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { ProjectSuppliersModule } from "../project-suppliers/project-suppliers.module";
import { AnthropicDiagnosticoCriativoProvider } from "./ai/anthropic-diagnostico-criativo.provider";
import { AnthropicProposalComponentsProvider } from "./ai/anthropic-proposal-components.provider";
import { ConceptualRenderPort } from "./ai/conceptual-render.port";
import { DiagnosticoCriativoPort } from "./ai/diagnostico-criativo.port";
import { GeminiConceptualRenderProvider } from "./ai/gemini-conceptual-render.provider";
import { ProposalComponentsPort } from "./ai/proposal-components.port";
import { CreativeController } from "./creative.controller";
import { PrismaProposalComponentRepository } from "./repositories/prisma-proposal-component.repository";
import { PrismaProposalRepository } from "./repositories/prisma-proposal.repository";
import { CommercialProposalRepository } from "./repositories/commercial-proposal.repository";
import { PrismaCommercialProposalRepository } from "./repositories/prisma-commercial-proposal.repository";
import { ProposalComponentRepository } from "./repositories/proposal-component.repository";
import { ProposalRepository } from "./repositories/proposal.repository";

@Module({
  imports: [BriefingModule, KnowledgeGraphModule, ProjectSuppliersModule],
  controllers: [CreativeController],
  providers: [
    { provide: ProposalRepository, useClass: PrismaProposalRepository },
    { provide: ProposalComponentRepository, useClass: PrismaProposalComponentRepository },
    { provide: CommercialProposalRepository, useClass: PrismaCommercialProposalRepository },
    { provide: DiagnosticoCriativoPort, useClass: AnthropicDiagnosticoCriativoProvider },
    { provide: ProposalComponentsPort, useClass: AnthropicProposalComponentsProvider },
    { provide: ConceptualRenderPort, useClass: GeminiConceptualRenderProvider },
  ],
  exports: [ProposalRepository, ProposalComponentRepository, CommercialProposalRepository],
})
export class CreativeModule {}
