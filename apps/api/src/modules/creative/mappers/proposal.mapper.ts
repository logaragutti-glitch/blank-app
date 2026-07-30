import type { Proposal as ProposalPrismaModel } from "@prisma/client";
import type { DiagnosticoCriativo, Proposal, ProposalStatus } from "@eve-os/types";

export function toProposalDomain(model: ProposalPrismaModel): Proposal {
  return {
    id: model.id,
    tenantId: model.tenantId,
    organizationId: model.organizationId,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
    createdBy: model.createdBy,
    updatedBy: model.updatedBy,
    version: model.version,
    eventId: model.eventId,
    eventStyleId: model.eventStyleId,
    diagnosticoCriativo: model.diagnosticoCriativo as unknown as DiagnosticoCriativo,
    conceptName: model.conceptName,
    wowScore: model.wowScore ? model.wowScore.toNumber() : null,
    status: model.status as ProposalStatus,
    investmentAmount: model.investmentAmount ? model.investmentAmount.toNumber() : null,
  };
}
