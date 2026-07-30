import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { AnthropicDiagnosticoCriativoProvider } from "./ai/anthropic-diagnostico-criativo.provider";
import { DiagnosticoCriativoPort } from "./ai/diagnostico-criativo.port";
import { CreativeController } from "./creative.controller";
import { PrismaProposalRepository } from "./repositories/prisma-proposal.repository";
import { ProposalRepository } from "./repositories/proposal.repository";

@Module({
  imports: [BriefingModule, KnowledgeGraphModule],
  controllers: [CreativeController],
  providers: [
    { provide: ProposalRepository, useClass: PrismaProposalRepository },
    { provide: DiagnosticoCriativoPort, useClass: AnthropicDiagnosticoCriativoProvider },
  ],
  exports: [ProposalRepository],
})
export class CreativeModule {}
