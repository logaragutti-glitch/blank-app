import type {
  BudgetAnalysis,
  CommercialProposal,
  CommercialPricingStatus,
  CommercialProposalSupplierInput,
  CommercialSupplierCategory,
  ChatMessage,
  Client,
  ClientInteraction,
  ClientInteractionType,
  DiagnosticoCriativo,
  Event,
  EventStyle,
  EventType,
  InspirationImage,
  Material,
  MaterialCategory,
  ProductionPlan,
  ProjectFile,
  ProjectTask,
  ProjectTaskStatus,
  Proposal,
  ProposalComponent,
  ProposalStatus,
  Supplier,
  SupplierCategory,
  User,
  Venue,
} from "@eve-os/types";

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export type WeddingKnowledgeEvidenceLevel = "OFFICIAL" | "DIRECTORY" | "SOCIAL_LEAD";
export type WeddingKnowledgeStatus = "VALIDATED" | "REQUIRES_CONFIRMATION";

export interface WeddingFormatResearch {
  id: string;
  axis: string;
  slug: string;
  name: string;
  description: string;
  guestMin: number | null;
  guestMax: number | null;
  durationMinDays: number | null;
  durationMaxDays: number | null;
  travelRequired: boolean;
  ceremonyOnly: boolean;
  planningNotes: string[];
  sourceUrls: string[];
}

export interface WeddingTrendResearch {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  applicationNotes: string[];
  productionConsiderations: string[];
  paletteColors: string[];
  materials: string[];
  sourceUrls: string[];
  geography: string | null;
}

export interface WeddingVenueImageResearch {
  id: string;
  imageUrl: string;
  sourceUrl: string;
  sourceType: string;
  roomType: string;
  credit: string | null;
  rightsStatus: string;
  confidence: string;
  usageScope: string;
  approvedForPublication: boolean;
  isPrimary: boolean;
  isActive: boolean;
  sourceCapturedAt: string;
  notes: string | null;
}

export interface WeddingVenueResearch {
  id: string;
  name: string;
  municipality: string;
  venueType: string;
  evidenceLevel: WeddingKnowledgeEvidenceLevel;
  status: WeddingKnowledgeStatus;
  capacityMin: number | null;
  capacityMax: number | null;
  lodgingCapacity: number | null;
  priceNote: string | null;
  services: string[];
  sourceUrls: string[];
  contact: string | null;
  notes: string | null;
  images: WeddingVenueImageResearch[];
}

export interface WeddingKnowledgeResponse {
  formats: WeddingFormatResearch[];
  trends: WeddingTrendResearch[];
  venues: WeddingVenueResearch[];
}

export interface SupplierCatalogCategory {
  id: string;
  slug: string;
  name: string;
  categoryType: "FURNITURE" | "LIGHTING" | "DECOR" | "STRUCTURE" | "TEXTILE" | "ACCESSORY" | "OTHER";
  listedProductCount: number | null;
  sourceUrl: string;
  productNames: string[];
  extractionStatus: string;
  notes: string | null;
  sourceCapturedAt: string;
}

export interface SupplierCatalogResponse {
  supplier: Pick<Supplier, "id" | "name" | "category">;
  categories: SupplierCatalogCategory[];
}

/** GET /projects — a read model, not a single domain entity (see apps/api/src/modules/projects). */
export interface ProjectSummary {
  eventId: string;
  clientId: string;
  clientNames: string;
  venueName: string | null;
  type: EventType;
  status: Event["status"];
  budgetAmount: number | null;
  guestsExpected: number | null;
  ceremonyDateTime: string | null;
  createdAt: string;
  latestProposal: {
    id: string;
    status: Proposal["status"];
    conceptName: string | null;
    wowScore: number | null;
  } | null;
}

export interface CreateBriefingResponse {
  client: Client;
  event: Event;
}

/** GET /creative/proposals/:proposalId/document */
export interface ProposalDocument {
  proposal: Proposal;
  components: ProposalComponent[];
}

export type EventCanvasNodeCategory =
  | "CLIENT"
  | "VENUE"
  | "FLOWERS"
  | "FURNITURE"
  | "LIGHTING"
  | "MUSIC"
  | "CATERING"
  | "EXPERIENCE";

export interface EventCanvasNode {
  category: EventCanvasNodeCategory;
  summary: string | null;
  items: string[];
  hasData: boolean;
}

/** GET /projects/:eventId/canvas — a read model, not a single domain entity (see apps/api/src/modules/projects). */
export interface EventCanvas {
  eventId: string;
  hasDiagnostico: boolean;
  nodes: EventCanvasNode[];
}

/** GET /events/:eventId/team — a membership record composed with the assignee's name/e-mail (see apps/api/src/modules/team). */
export interface TeamMember {
  eventId: string;
  userId: string;
  role: string;
  addedAt: string;
  name: string;
  email: string | null;
}

export type ProjectSupplierStatus = "CONTACTED" | "NEGOTIATING" | "BOOKED" | "CANCELLED";

/** GET /events/:eventId/suppliers — a membership record composed with the supplier's name/category (see apps/api/src/modules/project-suppliers). */
export interface ProjectSupplierAssignment {
  eventId: string;
  supplierId: string;
  status: ProjectSupplierStatus;
  notes: string | null;
  addedAt: string;
  name: string;
  category: SupplierCategory | null;
}

/** GET /production/financial-summary — a read model, not a single domain entity (see apps/api/src/modules/production). */
export interface FinancialSummary {
  totalEvents: number;
  eventsWithBudget: number;
  totalBudgetAmount: number;
  eventsWithBudgetAnalysis: number;
  totalEstimatedCost: number;
  fitsBudgetCount: number;
  overBudgetCount: number;
  projects: {
    eventId: string;
    clientNames: string;
    budgetAmount: number | null;
    totalEstimatedCost: number | null;
    fitsBudget: boolean | null;
  }[];
}

export type {
  BudgetAnalysis,
  CommercialProposal,
  CommercialPricingStatus,
  CommercialProposalSupplierInput,
  CommercialSupplierCategory,
  ChatMessage,
  Client,
  ClientInteraction,
  ClientInteractionType,
  DiagnosticoCriativo,
  Event,
  EventStyle,
  EventType,
  InspirationImage,
  Material,
  MaterialCategory,
  ProductionPlan,
  ProjectFile,
  ProjectTask,
  ProjectTaskStatus,
  Proposal,
  ProposalComponent,
  ProposalStatus,
  Supplier,
  SupplierCategory,
  User,
  Venue,
};
