import type { ClientInteraction as ClientInteractionPrismaModel } from "@prisma/client";
import type { ClientInteraction, ClientInteractionType } from "@eve-os/types";

export function toClientInteractionDomain(model: ClientInteractionPrismaModel): ClientInteraction {
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
    clientId: model.clientId,
    type: model.type as ClientInteractionType,
    occurredAt: model.occurredAt.toISOString(),
    notes: model.notes,
  };
}
