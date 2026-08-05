import type { ProjectTask as ProjectTaskPrismaModel } from "@prisma/client";
import type { ProjectTask, ProjectTaskStatus } from "@eve-os/types";

export function toProjectTaskDomain(model: ProjectTaskPrismaModel): ProjectTask {
  return {
    id: model.id,
    tenantId: model.tenantId,
    organizationId: model.organizationId,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
    createdBy: model.createdBy,
    updatedBy: model.updatedBy,
    version: model.version,
    eventId: model.eventId,
    title: model.title,
    description: model.description,
    status: model.status as ProjectTaskStatus,
    dueDate: model.dueDate ? model.dueDate.toISOString() : null,
    assigneeUserId: model.assigneeUserId,
  };
}
