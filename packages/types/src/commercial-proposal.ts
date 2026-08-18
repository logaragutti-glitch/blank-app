export type CommercialProposalStatus =
  | "DRAFT"
  | "READY"
  | "SENT"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type CommercialProposalScope = "FULL_EVENT" | "DECORATION_ONLY";

export type CommercialProposalVersionAction =
  | "CREATED"
  | "UPDATED"
  | "READY"
  | "SENT"
  | "APPROVED"
  | "REJECTED";

export type CommercialVenueSource = "INTERNAL_VENUE" | "RESEARCH_CATALOG";

export type CommercialPricingStatus = "ESTIMATE" | "QUOTE_PENDING" | "CONFIRMED";

export type CommercialSupplierCategory =
  | "VENUE"
  | "CATERING"
  | "DECOR"
  | "FURNITURE_RENTAL"
  | "PHOTOGRAPHY"
  | "MUSIC"
  | "LIGHTING"
  | "ASSEMBLY_CREW"
  | "OTHER";

export interface CommercialVenueSnapshot {
  id: string | null;
  source: CommercialVenueSource;
  name: string;
  municipality: string | null;
  venueType: string | null;
  capacityMin: number | null;
  capacityMax: number | null;
  guestCapacity: number | null;
  lodgingCapacity: number | null;
  contact: string | null;
  services: string[];
  recommendationNotes: string[];
  status: string | null;
  evidenceLevel: string | null;
  sourceUrls: string[];
}

export interface CommercialSupplierSelection {
  supplierId: string;
  name: string;
  category: CommercialSupplierCategory;
  categoryLabel: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagramUrl: string | null;
  serviceArea: string[];
  validationLevel: string | null;
  contactStatus: string;
  estimatedCost: number | null;
  assignmentStatus: string | null;
  notes: string | null;
  scope: string;
  pricingStatus: CommercialPricingStatus;
}

export interface CommercialLineItem {
  id: string;
  category: CommercialSupplierCategory;
  categoryLabel: string;
  description: string;
  supplierId: string | null;
  supplierName: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  pricingStatus: CommercialPricingStatus;
  included: boolean;
  notes: string | null;
}

export interface CommercialPaymentTerm {
  label: string;
  description: string;
  amount: number | null;
  due: string | null;
}

export interface CommercialProposal {
  id: string;
  proposalId: string;
  eventId: string;
  version: number;
  status: CommercialProposalStatus;
  scope: CommercialProposalScope;
  clientNames: string;
  eventType: string;
  eventDate: string | null;
  guestsExpected: number | null;
  venue: CommercialVenueSnapshot;
  suppliers: CommercialSupplierSelection[];
  lineItems: CommercialLineItem[];
  subtotal: number;
  contingencyAmount: number;
  managementFee: number;
  discount: number;
  totalInvestment: number;
  currency: "BRL";
  validityDays: number;
  validUntil: string | null;
  approvalDeadline: string | null;
  paymentTerms: CommercialPaymentTerm[];
  conditions: string[];
  nextSteps: string[];
  commercialNotes: string | null;
  hasUnconfirmedData: boolean;
  sentAt: string | null;
  sentBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialProposalVersion {
  id: string;
  commercialProposalId: string;
  version: number;
  action: CommercialProposalVersionAction;
  status: CommercialProposalStatus;
  totalInvestment: number;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface CommercialProposalSupplierInput {
  supplierId: string;
  scope?: string;
  pricingStatus?: CommercialPricingStatus;
  unitPrice?: number;
  quantity?: number;
  unit?: string;
  notes?: string | null;
}

export interface UpsertCommercialProposalInput {
  scope?: CommercialProposalScope;
  venueResearchId?: string | null;
  supplierSelections: CommercialProposalSupplierInput[];
  lineItems?: Array<{
    id?: string;
    category: CommercialSupplierCategory;
    description: string;
    supplierId?: string | null;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    pricingStatus?: CommercialPricingStatus;
    included?: boolean;
    notes?: string | null;
  }>;
  contingencyPercent?: number;
  managementFee?: number;
  discount?: number;
  validityDays?: number;
  approvalDeadline?: string | null;
  paymentTerms?: CommercialPaymentTerm[];
  conditions?: string[];
  nextSteps?: string[];
  commercialNotes?: string | null;
}
