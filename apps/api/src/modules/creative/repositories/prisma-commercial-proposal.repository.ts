import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  CommercialProposal,
  CommercialProposalStatus,
  CommercialProposalVersionAction,
} from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import {
  CommercialProposalRepository,
  type UpsertCommercialProposalRecordInput,
} from "./commercial-proposal.repository";
import {
  toCommercialProposalDomain,
  toCommercialProposalVersionDomain,
} from "../mappers/commercial-proposal.mapper";

@Injectable()
export class PrismaCommercialProposalRepository implements CommercialProposalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProposal(proposalId: string): Promise<CommercialProposal | null> {
    const record = await this.prisma.commercialProposal.findUnique({ where: { proposalId } });
    return record ? toCommercialProposalDomain(record) : null;
  }

  async findVersions(proposalId: string) {
    const commercial = await this.prisma.commercialProposal.findUnique({ where: { proposalId } });
    if (!commercial) return [];
    const versions = await this.prisma.commercialProposalVersion.findMany({
      where: { commercialProposalId: commercial.id },
      orderBy: { version: "asc" },
    });
    return versions.map(toCommercialProposalVersionDomain);
  }

  async upsert(input: UpsertCommercialProposalRecordInput): Promise<CommercialProposal> {
    const record = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.commercialProposal.findUnique({
        where: { proposalId: input.proposalId },
      });
      const version = (existing?.version ?? 0) + 1;
      const status = input.status ?? "DRAFT";
      const base = {
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
        version,
        status,
        sentAt: null,
        sentBy: null,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
      };

      const record = await tx.commercialProposal.upsert({
        where: { proposalId: input.proposalId },
        create: {
          tenantId: input.tenantId,
          organizationId: input.organizationId,
          proposalId: input.proposalId,
          eventId: input.eventId,
          ...base,
        },
        update: base,
      });

      await tx.commercialProposalVersion.create({
        data: {
          commercialProposalId: record.id,
          version,
          action: existing ? "UPDATED" : "CREATED",
          status: record.status,
          totalInvestment: record.totalInvestment,
          snapshot: toCommercialProposalDomain(record) as unknown as Prisma.InputJsonValue,
          notes: null,
          createdBy: input.createdBy,
        },
      });
      return record;
    });

    return toCommercialProposalDomain(record);
  }

  async updateStatus(input: {
    proposalId: string;
    status: CommercialProposalStatus;
    action: CommercialProposalVersionAction;
    actorId: string;
    notes?: string | null;
  }): Promise<CommercialProposal> {
    const record = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.commercialProposal.findUnique({
        where: { proposalId: input.proposalId },
      });
      if (!existing) throw new Error("Commercial proposal not found");

      const version = existing.version + 1;
      const now = new Date();
      const updated = await tx.commercialProposal.update({
        where: { id: existing.id },
        data: {
          version,
          status: input.status,
          sentAt: input.status === "SENT" ? now : existing.sentAt,
          sentBy: input.status === "SENT" ? input.actorId : existing.sentBy,
          approvedAt: input.status === "APPROVED" ? now : existing.approvedAt,
          approvedBy: input.status === "APPROVED" ? input.actorId : existing.approvedBy,
          rejectionReason: input.status === "REJECTED" ? input.notes ?? null : null,
        },
      });

      await tx.commercialProposalVersion.create({
        data: {
          commercialProposalId: updated.id,
          version,
          action: input.action,
          status: updated.status,
          totalInvestment: updated.totalInvestment,
          snapshot: toCommercialProposalDomain(updated) as unknown as Prisma.InputJsonValue,
          notes: input.notes ?? null,
          createdBy: input.actorId,
        },
      });
      return updated;
    });

    return toCommercialProposalDomain(record);
  }
}
