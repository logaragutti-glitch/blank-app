import type { DiagnosticoCriativo, Proposal } from "@eve-os/types";

export interface CreateProposalInput {
  tenantId: string;
  organizationId: string;
  eventId: string;
  eventStyleId?: string | null;
  diagnosticoCriativo: DiagnosticoCriativo;
  conceptName?: string | null;
  /** See wow-score.ts — null when there isn't enough data to compute it yet. */
  wowScore?: number | null;
}

export abstract class ProposalRepository {
  abstract create(input: CreateProposalInput): Promise<Proposal>;
  abstract findById(organizationId: string, id: string): Promise<Proposal | null>;
  abstract findByEvent(organizationId: string, eventId: string): Promise<Proposal[]>;
  /** Sets the named concept once Agente 3 has generated the CONCEPT component. */
  abstract updateConceptName(id: string, conceptName: string): Promise<Proposal>;
}
