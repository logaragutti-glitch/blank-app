import type { DiagnosticoCriativo, Proposal } from "@eve-os/types";

export interface CreateProposalInput {
  tenantId: string;
  organizationId: string;
  eventId: string;
  eventStyleId?: string | null;
  diagnosticoCriativo: DiagnosticoCriativo;
  conceptName?: string | null;
}

export abstract class ProposalRepository {
  abstract create(input: CreateProposalInput): Promise<Proposal>;
  abstract findById(organizationId: string, id: string): Promise<Proposal | null>;
  abstract findByEvent(organizationId: string, eventId: string): Promise<Proposal[]>;
}
