export interface EveChatTaskSummary {
  title: string;
  status: string;
  dueDate: string | null;
}

export interface EveChatTeamMemberSummary {
  name: string;
  role: string;
}

export interface EveChatSupplierSummary {
  name: string;
  category: string;
  status: string;
}

export interface EveChatProposalSummary {
  status: string;
  conceptName: string | null;
  wowScore: number | null;
}

/**
 * A single generated section of the latest proposal (Capa, Moodboard,
 * Paleta, Entrada, Investimento...) — the same `type`/`content` shape as
 * `ProposalComponent` (@eve-os/types), passed through as-is rather than
 * reshaped into a bespoke DTO. Without this, EVE only knew the proposal's
 * status/concept/WOW Score and had to refuse every question about what's
 * actually *in* it ("what should we change about this proposal?"), which
 * is exactly the gap that surfaced once someone tried asking that.
 */
export interface EveChatProposalComponentSummary {
  type: string;
  order: number;
  content: Record<string, unknown>;
}

/** Everything real and already-known about this project that EVE is allowed to talk about — never invented, never fetched live by the model itself. */
export interface EveChatProjectContext {
  clientNames: string;
  eventType: string;
  ceremonyDateTime: string | null;
  guestsExpected: number | null;
  budgetAmount: number | null;
  venueName: string | null;
  latestProposal: EveChatProposalSummary | null;
  /** Empty when there's no proposal yet, or the proposal has no generated components yet. */
  proposalComponents: EveChatProposalComponentSummary[];
  tasks: EveChatTaskSummary[];
  team: EveChatTeamMemberSummary[];
  suppliers: EveChatSupplierSummary[];
}

export interface EveChatHistoryEntry {
  role: "USER" | "ASSISTANT";
  content: string;
}

export interface EveChatInput {
  context: EveChatProjectContext;
  /** Prior turns, oldest first — does not include `question`. */
  history: EveChatHistoryEntry[];
  question: string;
}

/** Port for the Chat com a EVE assistant (Bucket C) — a grounded Q&A companion, not yet an agent that can act on the system. */
export abstract class EveChatPort {
  abstract reply(input: EveChatInput): Promise<string>;
}
