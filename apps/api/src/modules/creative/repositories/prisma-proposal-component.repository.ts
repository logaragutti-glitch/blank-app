import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { ProposalComponent } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toProposalComponentDomain } from "../mappers/proposal-component.mapper";
import {
  ProposalComponentRepository,
  type UpsertProposalComponentInput,
} from "./proposal-component.repository";

@Injectable()
export class PrismaProposalComponentRepository implements ProposalComponentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProposal(proposalId: string): Promise<ProposalComponent[]> {
    const components = await this.prisma.proposalComponent.findMany({
      where: { proposalId },
      orderBy: { order: "asc" },
    });
    return components.map(toProposalComponentDomain);
  }

  async upsertMany(
    proposalId: string,
    components: UpsertProposalComponentInput[],
  ): Promise<ProposalComponent[]> {
    const rows = await this.prisma.$transaction(
      components.map((component) =>
        this.prisma.proposalComponent.upsert({
          where: { proposalId_type: { proposalId, type: component.type } },
          create: {
            proposalId,
            type: component.type,
            order: component.order,
            content: component.content as unknown as Prisma.InputJsonValue,
          },
          update: {
            order: component.order,
            content: component.content as unknown as Prisma.InputJsonValue,
          },
        }),
      ),
    );
    return rows.map(toProposalComponentDomain).sort((a, b) => a.order - b.order);
  }
}
