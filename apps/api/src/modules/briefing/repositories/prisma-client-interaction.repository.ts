import { Injectable } from "@nestjs/common";
import type { ClientInteraction } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toClientInteractionDomain } from "../mappers/client-interaction.mapper";
import {
  ClientInteractionRepository,
  type CreateClientInteractionInput,
} from "./client-interaction.repository";

@Injectable()
export class PrismaClientInteractionRepository implements ClientInteractionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByClient(clientId: string): Promise<ClientInteraction[]> {
    const interactions = await this.prisma.clientInteraction.findMany({
      where: { clientId, deletedAt: null },
      orderBy: { occurredAt: "desc" },
    });
    return interactions.map(toClientInteractionDomain);
  }

  async findById(id: string): Promise<ClientInteraction | null> {
    const interaction = await this.prisma.clientInteraction.findFirst({ where: { id, deletedAt: null } });
    return interaction ? toClientInteractionDomain(interaction) : null;
  }

  async create(
    tenantId: string,
    organizationId: string,
    clientId: string,
    input: CreateClientInteractionInput,
  ): Promise<ClientInteraction> {
    const interaction = await this.prisma.clientInteraction.create({
      data: {
        tenantId,
        organizationId,
        clientId,
        type: input.type,
        occurredAt: new Date(input.occurredAt),
        notes: input.notes,
        createdBy: input.createdBy,
      },
    });
    return toClientInteractionDomain(interaction);
  }

  async softDelete(id: string, updatedBy: string | null): Promise<void> {
    await this.prisma.clientInteraction.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  }
}
