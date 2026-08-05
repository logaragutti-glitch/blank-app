import type { ProjectSupplier as ProjectSupplierPrismaModel } from "@prisma/client";
import type { ProjectSupplier, ProjectSupplierStatus } from "../repositories/project-supplier.repository";

export function toProjectSupplierDomain(model: ProjectSupplierPrismaModel): ProjectSupplier {
  return {
    eventId: model.eventId,
    supplierId: model.supplierId,
    status: model.status as ProjectSupplierStatus,
    notes: model.notes,
    addedAt: model.addedAt.toISOString(),
  };
}
