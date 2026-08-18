import { createHash } from "node:crypto";
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Public } from "../auth/public.decorator";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ProjectSupplierRepository } from "../project-suppliers/repositories/project-supplier.repository";
import {
  PublicCommercialDecisionDto,
  PublicCommercialDecisionInputDto,
} from "./dto/public-commercial-decision.dto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function assertActiveLink(link: { revokedAt: Date | null; expiresAt: Date; decision: string }): void {
  if (link.revokedAt || link.expiresAt.getTime() < Date.now()) {
    throw new NotFoundException("Este link de aprovação expirou ou foi revogado.");
  }
}

function publicProposalView(proposal: any) {
  const event = (proposal.eventSnapshot ?? {}) as Record<string, unknown>;
  const venue = (proposal.venueSnapshot ?? {}) as Record<string, unknown>;
  return {
    id: proposal.id,
    version: proposal.version,
    status: proposal.status,
    scope: proposal.scope,
    clientNames: event.clientNames ?? "",
    eventType: event.eventType ?? "",
    eventDate: event.eventDate ?? null,
    guestsExpected: event.guestsExpected ?? null,
    venue,
    suppliers: proposal.supplierSelections ?? [],
    lineItems: proposal.lineItems ?? [],
    logisticsItems: proposal.logisticsItems ?? [],
    packages: proposal.packages ?? [],
    subtotal: Number(proposal.subtotal),
    contingencyAmount: Number(proposal.contingencyAmount),
    managementFee: Number(proposal.managementFee),
    discount: Number(proposal.discount),
    totalInvestment: Number(proposal.totalInvestment),
    currency: "BRL",
    validityDays: proposal.validityDays,
    validUntil: proposal.validUntil?.toISOString() ?? null,
    conditions: proposal.conditions,
    nextSteps: proposal.nextSteps,
    commercialNotes: proposal.commercialNotes,
    hasUnconfirmedData: proposal.hasUnconfirmedData,
    payments: (proposal.payments ?? []).map((payment: any) => ({
      label: payment.label,
      amount: Number(payment.amount),
      dueDate: payment.dueDate.toISOString(),
      status: payment.status,
    })),
  };
}

@Controller("public/commercial-proposals")
export class PublicCommercialApprovalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectSuppliers: ProjectSupplierRepository,
  ) {}

  @Public()
  @Get(":token")
  async getProposal(@Param("token") token: string) {
    const link = await this.prisma.commercialApprovalLink.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        commercialProposal: {
          include: { payments: { orderBy: { dueDate: "asc" } } },
        },
      },
    });
    if (!link) throw new NotFoundException("Link de aprovação não encontrado.");
    assertActiveLink(link);
    await this.prisma.commercialApprovalLink.update({
      where: { id: link.id },
      data: { lastAccessedAt: new Date() },
    });
    return {
      decision: link.decision,
      expiresAt: link.expiresAt.toISOString(),
      recipientName: link.recipientName,
      proposal: publicProposalView(link.commercialProposal),
    };
  }

  @Public()
  @Post(":token/decision")
  async decideProposal(
    @Param("token") token: string,
    @Body() dto: PublicCommercialDecisionInputDto,
  ) {
    const link = await this.prisma.commercialApprovalLink.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { commercialProposal: true },
    });
    if (!link) throw new NotFoundException("Link de aprovação não encontrado.");
    assertActiveLink(link);
    if (link.decision !== "PENDING") {
      throw new NotFoundException("Este link já foi utilizado para uma decisão.");
    }

    const approved = dto.decision === PublicCommercialDecisionDto.APPROVED;
    const decision = approved ? "APPROVED" : "REJECTED";
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const proposal = await tx.commercialProposal.update({
        where: { id: link.commercialProposalId },
        data: {
          version: link.commercialProposal.version + 1,
          status: decision,
          approvedAt: approved ? now : null,
          approvedBy: null,
          rejectionReason: approved ? null : dto.comment ?? "Devolvida para revisão pelo cliente.",
        },
        include: { payments: { orderBy: { dueDate: "asc" } } },
      });
      await tx.commercialApprovalLink.update({
        where: { id: link.id },
        data: {
          decision,
          decidedAt: now,
          recipientName: dto.name ?? link.recipientName,
        },
      });
      await tx.commercialProposalVersion.create({
        data: {
          commercialProposalId: proposal.id,
          version: proposal.version,
          action: decision,
          status: decision,
          totalInvestment: proposal.totalInvestment,
          snapshot: publicProposalView(proposal) as unknown as Prisma.InputJsonValue,
          notes: dto.comment ?? null,
          createdBy: null,
        },
      });
      return proposal;
    });

    if (approved) {
      const supplierSelections = (updated.supplierSelections ?? []) as Array<{ supplierId: string; notes?: string | null }>;
      await Promise.all(
        supplierSelections.map((supplier) =>
          this.projectSuppliers.addOrUpdate(updated.eventId, {
            supplierId: supplier.supplierId,
            status: "BOOKED",
            notes: supplier.notes ?? "Fornecedor incluído na proposta aprovada pelo cliente.",
          }),
        ),
      );
    }

    return {
      decision,
      proposal: publicProposalView(updated),
    };
  }
}
