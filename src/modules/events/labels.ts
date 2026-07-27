import type { EventStatus } from "@prisma/client";

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "Rascunho",
  INTERVIEW: "Em entrevista",
  GENERATING: "Gerando",
  REVIEW: "Revisão",
  READY: "Pronto",
  ARCHIVED: "Arquivado",
};

export const EVENT_STATUS_BADGE: Record<
  EventStatus,
  "default" | "accent" | "success" | "warning" | "destructive"
> = {
  DRAFT: "default",
  INTERVIEW: "warning",
  GENERATING: "accent",
  REVIEW: "accent",
  READY: "success",
  ARCHIVED: "default",
};

export const EVENT_STATUS_ORDER: EventStatus[] = [
  "DRAFT",
  "INTERVIEW",
  "GENERATING",
  "REVIEW",
  "READY",
  "ARCHIVED",
];
