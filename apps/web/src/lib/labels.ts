import type { EventType, ProposalStatus } from "./api-types";

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  WEDDING: "Casamento",
  CORPORATE: "Corporativo",
  KIDS: "Infantil",
  DESTINATION: "Destination",
  VENUE_MANAGED: "Gerenciado pelo espaço",
  HOTEL: "Hotel",
  CONVENTION: "Convenção",
};

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  DRAFT: "Rascunho",
  INTERNAL_REVIEW: "Revisão interna",
  READY: "Pronta",
  SENT: "Enviada",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

export const PROPOSAL_STATUS_COLOR: Record<ProposalStatus, "primary" | "muted" | "danger"> = {
  DRAFT: "muted",
  INTERNAL_REVIEW: "muted",
  READY: "muted",
  SENT: "muted",
  APPROVED: "primary",
  REJECTED: "danger",
};
