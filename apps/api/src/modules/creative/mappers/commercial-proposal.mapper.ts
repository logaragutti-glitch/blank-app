import type {
  CommercialProposal as CommercialProposalPrismaModel,
  CommercialProposalVersion as CommercialProposalVersionPrismaModel,
  CommercialPayment as CommercialPaymentPrismaModel,
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
  CommercialLogisticsItem,
  CommercialPayment,
  CommercialSupplierSelection,
  CommercialVenueSnapshot,
} from "@eve-os/types";

function decimalToNumber(value: { toNumber(): number } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

type CommercialProposalRecord = CommercialProposalPrismaModel & { payments?: CommercialPaymentPrismaModel[] };

export function toCommercialProposalDomain(model: CommercialProposalRecord): CommercialProposal {
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
    logisticsItems: (model.logisticsItems ?? []) as unknown as CommercialLogisticsItem[],
    packages: (model.packages ?? []) as unknown as CommercialProposal["packages"],
    subtotal: decimalToNumber(model.subtotal),
    contingencyAmount: decimalToNumber(model.contingencyAmount),
    managementFee: decimalToNumber(model.managementFee),
    discount: decimalToNumber(model.discount),
    internalCost: decimalToNumber(model.internalCost),
    marginAmount: decimalToNumber(model.marginAmount),
    marginPercent: decimalToNumber(model.marginPercent),
    totalInvestment: decimalToNumber(model.totalInvestment),
    payments: (model.payments ?? []).map((payment) => ({
      id: payment.id,
      label: payment.label,
      amount: decimalToNumber(payment.amount),
      dueDate: payment.dueDate.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      status: payment.status,
      method: payment.method,
      notes: payment.notes,
    })) as CommercialPayment[],
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
