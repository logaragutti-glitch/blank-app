import type { Material as MaterialPrismaModel } from "@prisma/client";
import type { Material, MaterialCategory } from "@eve-os/types";

type MaterialWithStyleIds = MaterialPrismaModel & {
  compatibleStyles: { id: string }[];
  incompatibleStyles: { id: string }[];
};

export function toMaterialDomain(model: MaterialWithStyleIds): Material {
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
    category: model.category as MaterialCategory,
    emotions: model.emotions,
    seasons: model.seasons,
    neverRecommend: model.neverRecommend,
    compatibleStyleIds: model.compatibleStyles.map((style) => style.id),
    incompatibleStyleIds: model.incompatibleStyles.map((style) => style.id),
    estimatedUnitCost: model.estimatedUnitCost ? model.estimatedUnitCost.toNumber() : null,
  };
}
