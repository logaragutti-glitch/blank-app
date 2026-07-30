import type { DiagnosticoCriativo } from "./diagnostico-criativo";
import type { AuditedEntity } from "./tenant";

export type ProposalStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "READY"
  | "SENT"
  | "APPROVED"
  | "REJECTED";

export interface Proposal extends AuditedEntity {
  eventId: string;
  eventStyleId: string | null;
  diagnosticoCriativo: DiagnosticoCriativo;
  conceptName: string | null;
  wowScore: number | null;
  status: ProposalStatus;
  investmentAmount: number | null;
}
