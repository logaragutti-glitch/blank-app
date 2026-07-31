import type { ComponentType, ProposalComponent } from "@eve-os/types";

export interface UpsertProposalComponentInput {
  type: ComponentType;
  order: number;
  content: Record<string, unknown>;
}

export abstract class ProposalComponentRepository {
  abstract findByProposal(proposalId: string): Promise<ProposalComponent[]>;
  /**
   * Replaces the content of each component (keyed by the unique
   * `[proposalId, type]` pair), so regenerating a proposal's components
   * overwrites the previous version rather than duplicating rows.
   */
  abstract upsertMany(
    proposalId: string,
    components: UpsertProposalComponentInput[],
  ): Promise<ProposalComponent[]>;
}
