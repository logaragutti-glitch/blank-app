import type { InspirationImage as InspirationImagePrismaModel } from "@prisma/client";
import type { InspirationImage, InspirationImageStatus, VisionTags } from "@eve-os/types";

export function toInspirationImageDomain(model: InspirationImagePrismaModel): InspirationImage {
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
    status: model.status as InspirationImageStatus,
    visionTags: model.visionTags as VisionTags | null,
    visionDescription: model.visionDescription,
    processingError: model.processingError,
  };
}
