import type {
  CommercialProposal,
  CommercialProposalStatus,
  CommercialPaymentTerm,
  CommercialLineItem,
  CommercialSupplierSelection,
  CommercialVenueSnapshot,
} from "@eve-os/types";

export interface CommercialEventSnapshot {
  clientNames: string;
  eventType: string;
  eventDate: string | null;
  guestsExpected: number | null;
}

export interface UpsertCommercialProposalRecordInput {
  tenantId: string;
  organizationId: string;
  proposalId: string;
  eventId: string;
  status?: CommercialProposalStatus;
  eventSnapshot: CommercialEventSnapshot;
  venueSnapshot: CommercialVenueSnapshot;
  supplierSelections: CommercialSupplierSelection[];
  lineItems: CommercialLineItem[];
  subtotal: number;
  contingencyAmount: number;
  managementFee: number;
  discount: number;
  totalInvestment: number;
  validityDays: number;
  validUntil: Date | null;
  approvalDeadline: Date | null;
  paymentTerms: CommercialPaymentTerm[];
  conditions: string[];
  nextSteps: string[];
  commercialNotes: string | null;
  hasUnconfirmedData: boolean;
}

export abstract class CommercialProposalRepository {
  abstract findByProposal(proposalId: string): Promise<CommercialProposal | null>;
  abstract upsert(input: UpsertCommercialProposalRecordInput): Promise<CommercialProposal>;
}
