import type {
  CommercialProposal as CommercialProposalPrismaModel,
  CommercialProposalVersion as CommercialProposalVersionPrismaModel,
} from "@prisma/client";
import type { CommercialEventSnapshot } from "../repositories/commercial-proposal.repository";
import type {
  CommercialProposal,
  CommercialProposalScope,
  CommercialProposalStatus,
  CommercialProposalVersion,
  CommercialProposalVersionAction,
  CommercialPaymentTerm,
  CommercialLineItem,
  CommercialSupplierSelection,
  CommercialVenueSnapshot,
} from "@eve-os/types";

function decimalToNumber(value: { toNumber(): number } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

export function toCommercialProposalDomain(model: CommercialProposalPrismaModel): CommercialProposal {
  const event = model.eventSnapshot as unknown as CommercialEventSnapshot;
  const venue = model.venueSnapshot as unknown as CommercialVenueSnapshot;

  return {
    id: model.id,
    proposalId: model.proposalId,
    eventId: model.eventId,
    version: model.version,
    status: model.status as CommercialProposalStatus,
    scope: model.scope as CommercialProposalScope,
    clientNames: event.clientNames,
    eventType: event.eventType,
    eventDate: event.eventDate,
    guestsExpected: event.guestsExpected,
    venue,
    suppliers: model.supplierSelections as unknown as CommercialSupplierSelection[],
    lineItems: model.lineItems as unknown as CommercialLineItem[],
    subtotal: decimalToNumber(model.subtotal),
    contingencyAmount: decimalToNumber(model.contingencyAmount),
    managementFee: decimalToNumber(model.managementFee),
    discount: decimalToNumber(model.discount),
    totalInvestment: decimalToNumber(model.totalInvestment),
    currency: "BRL",
    validityDays: model.validityDays,
    validUntil: model.validUntil?.toISOString() ?? null,
    approvalDeadline: model.approvalDeadline?.toISOString() ?? null,
    paymentTerms: model.paymentTerms as unknown as CommercialPaymentTerm[],
    conditions: model.conditions,
    nextSteps: model.nextSteps,
    commercialNotes: model.commercialNotes,
    hasUnconfirmedData: model.hasUnconfirmedData,
    sentAt: model.sentAt?.toISOString() ?? null,
    sentBy: model.sentBy,
    approvedAt: model.approvedAt?.toISOString() ?? null,
    approvedBy: model.approvedBy,
    rejectionReason: model.rejectionReason,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

export function toCommercialProposalVersionDomain(
  model: CommercialProposalVersionPrismaModel,
): CommercialProposalVersion {
  return {
    id: model.id,
    commercialProposalId: model.commercialProposalId,
    version: model.version,
    action: model.action as CommercialProposalVersionAction,
    status: model.status as CommercialProposalStatus,
    totalInvestment: decimalToNumber(model.totalInvestment),
    notes: model.notes,
    createdAt: model.createdAt.toISOString(),
    createdBy: model.createdBy,
  };
}
