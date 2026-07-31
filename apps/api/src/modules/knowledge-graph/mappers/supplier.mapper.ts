import type { Supplier as SupplierPrismaModel } from "@prisma/client";
import type { Supplier, SupplierCategory } from "@eve-os/types";

type SupplierWithVenueIds = SupplierPrismaModel & {
  venues: { venueId: string }[];
};

export function toSupplierDomain(model: SupplierWithVenueIds): Supplier {
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
    category: model.category as SupplierCategory,
    performanceNotes: model.performanceNotes,
    preferredVenueIds: model.venues.map((venue) => venue.venueId),
    estimatedCost: model.estimatedCost ? model.estimatedCost.toNumber() : null,
  };
}
