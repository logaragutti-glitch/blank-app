import type { ProjectFile as ProjectFilePrismaModel } from "@prisma/client";
import type { ProjectFile } from "@eve-os/types";

export function toProjectFileDomain(model: ProjectFilePrismaModel): ProjectFile {
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
    storageKey: model.storageKey,
    originalFilename: model.originalFilename,
    mimeType: model.mimeType,
    sizeBytes: model.sizeBytes,
  };
}
