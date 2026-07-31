import type { DiagnosticoCriativo } from "@eve-os/types";

export interface ProposalComponentsClientContext {
  partnerOneName: string;
  partnerTwoName: string | null;
  howTheyMet: string | null;
  proposalStory: string | null;
}

export interface ProposalComponentsEventContext {
  type: string;
  guestsExpected: number | null;
}

export interface ProposalComponentsVenueContext {
  name: string;
  recommendationNotes: string[];
  structuralConstraints: string | null;
}

export interface ProposalComponentsInput {
  client: ProposalComponentsClientContext;
  event: ProposalComponentsEventContext;
  venue: ProposalComponentsVenueContext;
  diagnostico: DiagnosticoCriativo;
}

/** A single narrative block: a short title plus the descriptive copy. */
export interface NarrativeBlock {
  title: string;
  description: string;
}

/**
 * The 12 narrative/creative components Agente 3 generates in one call — the
 * other 6 (COVER, BIA_STORY, MOODBOARD, PALETTE, TIMELINE, INVESTMENT) are
 * assembled deterministically in code from data already known (see
 * ProposalComponentsBuilder), since they don't require creative writing.
 */
export interface ProposalComponentsResult {
  concept: NarrativeBlock;
  coupleStory: NarrativeBlock;
  entrance: NarrativeBlock;
  ceremony: NarrativeBlock;
  cakeTable: NarrativeBlock;
  lounge: NarrativeBlock;
  guestTables: NarrativeBlock;
  bar: NarrativeBlock;
  buffet: NarrativeBlock;
  danceFloor: NarrativeBlock;
  lighting: NarrativeBlock;
  florals: NarrativeBlock;
}

/** Port for Agente 3 / Creative Engine (Capitulo 7 narrative components). */
export abstract class ProposalComponentsPort {
  abstract generate(input: ProposalComponentsInput): Promise<ProposalComponentsResult>;
}
