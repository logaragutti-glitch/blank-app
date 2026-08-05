import type { ProjectTask, ProjectTaskStatus } from "@eve-os/types";

export interface CreateProjectTaskInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  assigneeUserId?: string | null;
  createdBy: string | null;
}

export interface UpdateProjectTaskInput {
  title?: string;
  description?: string | null;
  status?: ProjectTaskStatus;
  dueDate?: string | null;
  assigneeUserId?: string | null;
  updatedBy: string | null;
}

export abstract class ProjectTaskRepository {
  abstract findByEvent(eventId: string): Promise<ProjectTask[]>;
  abstract findById(id: string): Promise<ProjectTask | null>;
  abstract create(
    tenantId: string,
    organizationId: string,
    eventId: string,
    input: CreateProjectTaskInput,
  ): Promise<ProjectTask>;
  abstract update(id: string, input: UpdateProjectTaskInput): Promise<ProjectTask>;
  // Soft delete, same convention as every other AuditedEntity — there's no
  // dedicated deletedBy column (see AuditedEntity), so the actor is
  // recorded in updatedBy, same as any other write.
  abstract softDelete(id: string, updatedBy: string | null): Promise<void>;
}
