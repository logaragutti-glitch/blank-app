import type { EventType, ProductionPlan, ProposalStatus, User } from "@eve-os/types";

export interface AuthResponse {
  accessToken: string;
  user: User;
}

/** GET /projects — a composed read model (apps/api/src/modules/projects), not a single domain entity. */
export interface ProjectSummary {
  eventId: string;
  clientNames: string;
  venueName: string | null;
  type: EventType;
  status: string;
  guestsExpected: number | null;
  ceremonyDateTime: string | null;
  createdAt: string;
  latestProposal: {
    id: string;
    status: ProposalStatus;
    conceptName: string | null;
    wowScore: number | null;
  } | null;
}

export type { ProductionPlan };
