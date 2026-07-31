import type { Event as EventPrismaModel } from "@prisma/client";
import type { Event, EventStatus, EventType } from "@eve-os/types";

export function toEventDomain(model: EventPrismaModel): Event {
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
    type: model.type as EventType,
    status: model.status as EventStatus,
    clientId: model.clientId,
    venueId: model.venueId,
    guestsExpected: model.guestsExpected,
    ceremonyDateTime: model.ceremonyDateTime ? model.ceremonyDateTime.toISOString() : null,
    budgetAmount: model.budgetAmount ? model.budgetAmount.toNumber() : null,
    dnaScores: model.dnaScores as Record<string, number> | null,
    genome: model.genome,
  };
}
