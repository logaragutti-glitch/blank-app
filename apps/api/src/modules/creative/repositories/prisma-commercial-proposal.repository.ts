import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { CommercialProposal } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import {
  CommercialProposalRepository,
  type UpsertCommercialProposalRecordInput,
} from "./commercial-proposal.repository";
import { toCommercialProposalDomain } from "../mappers/commercial-proposal.mapper";

@Injectable()
export class PrismaCommercialProposalRepository implements CommercialProposalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProposal(proposalId: string): Promise<CommercialProposal | null> {
    const record = await this.prisma.commercialProposal.findUnique({ where: { proposalId } });
    return record ? toCommercialProposalDomain(record) : null;
  }

  async upsert(input: UpsertCommercialProposalRecordInput): Promise<CommercialProposal> {
    const data = {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      eventId: input.eventId,
      status: input.status ?? "DRAFT",
      eventSnapshot: input.eventSnapshot as unknown as Prisma.InputJsonValue,
      venueSnapshot: input.venueSnapshot as unknown as Prisma.InputJsonValue,
      supplierSelections: input.supplierSelections as unknown as Prisma.InputJsonValue,
      lineItems: input.lineItems as unknown as Prisma.InputJsonValue,
      subtotal: input.subtotal,
      contingencyAmount: input.contingencyAmount,
      managementFee: input.managementFee,
      discount: input.discount,
      totalInvestment: input.totalInvestment,
      validityDays: input.validityDays,
      validUntil: input.validUntil,
      approvalDeadline: input.approvalDeadline,
      paymentTerms: input.paymentTerms as unknown as Prisma.InputJsonValue,
      conditions: input.conditions,
      nextSteps: input.nextSteps,
      commercialNotes: input.commercialNotes,
      hasUnconfirmedData: input.hasUnconfirmedData,
    };

    const record = await this.prisma.commercialProposal.upsert({
      where: { proposalId: input.proposalId },
      create: data,
      update: {
        ...data,
        tenantId: undefined,
        organizationId: undefined,
        proposalId: undefined,
        eventId: undefined,
      },
    });
    return toCommercialProposalDomain(record);
  }
}
