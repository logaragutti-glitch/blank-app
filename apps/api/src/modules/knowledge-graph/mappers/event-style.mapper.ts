import type { EventStyle as EventStylePrismaModel } from "@prisma/client";
import type { EventStyle, StyleDimensionScores } from "@eve-os/types";

export function toEventStyleDomain(model: EventStylePrismaModel): EventStyle {
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
    description: model.description,
    dimensionScores: model.dimensionScores as StyleDimensionScores,
    paletteColors: model.paletteColors,
    furnitureNotes: model.furnitureNotes,
    loungeNotes: model.loungeNotes,
  };
}
