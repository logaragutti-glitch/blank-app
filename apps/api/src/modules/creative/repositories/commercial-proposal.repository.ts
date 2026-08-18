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
  scope: CommercialProposalScope;
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
  createdBy: string | null;
}

export abstract class CommercialProposalRepository {
  abstract findByProposal(proposalId: string): Promise<CommercialProposal | null>;
  abstract findVersions(proposalId: string): Promise<CommercialProposalVersion[]>;
  abstract upsert(input: UpsertCommercialProposalRecordInput): Promise<CommercialProposal>;
  abstract updateStatus(input: {
    proposalId: string;
    status: CommercialProposalStatus;
    action: CommercialProposalVersionAction;
    actorId: string;
    notes?: string | null;
  }): Promise<CommercialProposal>;
}
