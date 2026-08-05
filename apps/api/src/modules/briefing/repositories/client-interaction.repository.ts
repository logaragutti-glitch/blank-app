import type { ClientInteraction, ClientInteractionType } from "@eve-os/types";

export interface CreateClientInteractionInput {
  type: ClientInteractionType;
  occurredAt: string;
  notes: string;
  createdBy: string | null;
}

export abstract class ClientInteractionRepository {
  /** Most recent first — backs the timeline on the client detail screen. */
  abstract findByClient(clientId: string): Promise<ClientInteraction[]>;
  abstract findById(id: string): Promise<ClientInteraction | null>;
  abstract create(
    tenantId: string,
    organizationId: string,
    clientId: string,
    input: CreateClientInteractionInput,
  ): Promise<ClientInteraction>;
  // Soft delete, same convention as ProjectTask — no dedicated deletedBy
  // column, so the actor is recorded in updatedBy.
  abstract softDelete(id: string, updatedBy: string | null): Promise<void>;
}
