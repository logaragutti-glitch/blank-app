import type { Venue as VenuePrismaModel } from "@prisma/client";
import type { Venue } from "@eve-os/types";

export function toVenueDomain(model: VenuePrismaModel): Venue {
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
    name: model.name,
    structuralConstraints: model.structuralConstraints,
    ceilingHeightMeters: model.ceilingHeightMeters ? model.ceilingHeightMeters.toNumber() : null,
    powerOutlets: model.powerOutlets,
    guestCapacity: model.guestCapacity,
    existingFurniture: model.existingFurniture,
    typicalClimate: model.typicalClimate,
    recommendationNotes: model.recommendationNotes,
  };
}
