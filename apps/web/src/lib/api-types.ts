import type {
  BudgetAnalysis,
  Client,
  DiagnosticoCriativo,
  Event,
  EventStyle,
  EventType,
  InspirationImage,
  Material,
  MaterialCategory,
  ProductionPlan,
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

/** GET /projects — a read model, not a single domain entity (see apps/api/src/modules/projects). */
export interface ProjectSummary {
  eventId: string;
  clientId: string;
  clientNames: string;
  venueName: string | null;
  type: EventType;
  status: Event["status"];
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

export type {
  BudgetAnalysis,
  Client,
  DiagnosticoCriativo,
  Event,
  EventStyle,
  InspirationImage,
  Material,
  MaterialCategory,
  ProductionPlan,
  Proposal,
  ProposalComponent,
  ProposalStatus,
  Supplier,
  SupplierCategory,
  User,
  Venue,
};
