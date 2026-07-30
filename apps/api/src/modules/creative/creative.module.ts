import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { AnthropicDiagnosticoCriativoProvider } from "./ai/anthropic-diagnostico-criativo.provider";
import { AnthropicProposalComponentsProvider } from "./ai/anthropic-proposal-components.provider";
import { DiagnosticoCriativoPort } from "./ai/diagnostico-criativo.port";
import { ProposalComponentsPort } from "./ai/proposal-components.port";
import { CreativeController } from "./creative.controller";
import { PrismaProposalComponentRepository } from "./repositories/prisma-proposal-component.repository";
import { PrismaProposalRepository } from "./repositories/prisma-proposal.repository";
import { ProposalComponentRepository } from "./repositories/proposal-component.repository";
import { ProposalRepository } from "./repositories/proposal.repository";

@Module({
  imports: [BriefingModule, KnowledgeGraphModule],
  controllers: [CreativeController],
  providers: [
    { provide: ProposalRepository, useClass: PrismaProposalRepository },
    { provide: ProposalComponentRepository, useClass: PrismaProposalComponentRepository },
    { provide: DiagnosticoCriativoPort, useClass: AnthropicDiagnosticoCriativoProvider },
    { provide: ProposalComponentsPort, useClass: AnthropicProposalComponentsProvider },
  ],
  exports: [ProposalRepository, ProposalComponentRepository],
})
export class CreativeModule {}
