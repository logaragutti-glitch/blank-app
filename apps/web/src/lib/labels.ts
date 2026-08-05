import type { EventType, ProjectSupplierStatus, ProposalStatus, SupplierCategory } from "./api-types";

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

export const SUPPLIER_CATEGORY_LABEL: Record<SupplierCategory, string> = {
  FLORIST: "Florista",
  CATERING: "Buffet",
  LIGHTING: "Iluminação",
  FURNITURE_RENTAL: "Locação de mobiliário",
  PHOTOGRAPHY: "Fotografia",
  MUSIC: "Música",
  ASSEMBLY_CREW: "Equipe de montagem",
  OTHER: "Outro",
};

export const PROJECT_SUPPLIER_STATUS_LABEL: Record<ProjectSupplierStatus, string> = {
  CONTACTED: "Contatado",
  NEGOTIATING: "Em negociação",
  BOOKED: "Contratado",
  CANCELLED: "Cancelado",
};

export const PROJECT_SUPPLIER_STATUS_COLOR: Record<ProjectSupplierStatus, "primary" | "muted" | "danger"> = {
  CONTACTED: "muted",
  NEGOTIATING: "muted",
  BOOKED: "primary",
  CANCELLED: "danger",
};
