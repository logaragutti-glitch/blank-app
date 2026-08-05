import type { AuditedEntity } from "./tenant";

export type ProjectTaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

/**
 * A checklist item for an Event (Tarefas do Projeto, Bucket C) — separate
 * from ProductionPlan.checklist, which is an AI-generated artifact
 * regenerated wholesale from a Proposal rather than hand-edited
 * item-by-item. assigneeUserId is optional and not validated against a
 * live User at read time (see ProjectTask in schema.prisma).
 */
export interface ProjectTask extends AuditedEntity {
  eventId: string;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  dueDate: string | null;
  assigneeUserId: string | null;
}
