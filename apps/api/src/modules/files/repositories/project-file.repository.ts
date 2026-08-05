import type { ProjectFile } from "@eve-os/types";

export interface CreateProjectFileInput {
  tenantId: string;
  organizationId: string;
  eventId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdBy: string | null;
}

export abstract class ProjectFileRepository {
  /** Most recent first — backs the file list on the project screen. */
  abstract findByEvent(eventId: string): Promise<ProjectFile[]>;
  abstract findById(id: string): Promise<ProjectFile | null>;
  abstract create(input: CreateProjectFileInput): Promise<ProjectFile>;
  // Soft delete, same convention as ProjectTask/ClientInteraction — no
  // dedicated deletedBy column, so the actor is recorded in updatedBy.
  // The underlying S3 object is intentionally left in place: it isn't
  // re-uploaded on undo, and a stray orphaned object costs nothing
  // meaningful, unlike a broken "the file used to be here" record.
  abstract softDelete(id: string, updatedBy: string | null): Promise<void>;
}
