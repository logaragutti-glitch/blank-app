import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Proposal, ProposalStatus } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toProposalDomain } from "../mappers/proposal.mapper";
import { ProposalRepository, type CreateProposalInput } from "./proposal.repository";

@Injectable()
export class PrismaProposalRepository implements ProposalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateProposalInput): Promise<Proposal> {
    const proposal = await this.prisma.proposal.create({
      data: {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        eventId: input.eventId,
        eventStyleId: input.eventStyleId ?? undefined,
        conceptName: input.conceptName ?? undefined,
        wowScore: input.wowScore ?? undefined,
        diagnosticoCriativo: input.diagnosticoCriativo as unknown as Prisma.InputJsonValue,
      },
    });
    return toProposalDomain(proposal);
  }

  async findById(organizationId: string, id: string): Promise<Proposal | null> {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return proposal ? toProposalDomain(proposal) : null;
  }

  async findByEvent(organizationId: string, eventId: string): Promise<Proposal[]> {
    const proposals = await this.prisma.proposal.findMany({
      where: { eventId, organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return proposals.map(toProposalDomain);
  }

  async updateConceptName(id: string, conceptName: string): Promise<Proposal> {
    const proposal = await this.prisma.proposal.update({
      where: { id },
      data: { conceptName },
    });
    return toProposalDomain(proposal);
  }

  async updateStatus(id: string, status: ProposalStatus): Promise<Proposal> {
    const proposal = await this.prisma.proposal.update({
      where: { id },
      data: { status },
    });
    return toProposalDomain(proposal);
  }
}
