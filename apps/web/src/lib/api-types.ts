import type {
  BudgetAnalysis,
  Client,
  DiagnosticoCriativo,
  Event,
  EventType,
  InspirationImage,
  ProductionPlan,
  Proposal,
  ProposalComponent,
  ProposalStatus,
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

export type {
  BudgetAnalysis,
  Client,
  DiagnosticoCriativo,
  Event,
  InspirationImage,
  ProductionPlan,
  Proposal,
  ProposalComponent,
  ProposalStatus,
  User,
  Venue,
};
