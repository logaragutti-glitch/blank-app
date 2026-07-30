import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Client } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toClientDomain } from "../mappers/client.mapper";
import { ClientRepository, type CreateClientInput } from "./client.repository";

@Injectable()
export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateClientInput): Promise<Client> {
    const client = await this.prisma.client.create({
      data: {
        ...input,
        additionalDetails: input.additionalDetails as Prisma.InputJsonValue | undefined,
      },
    });
    return toClientDomain(client);
  }

  async findById(organizationId: string, id: string): Promise<Client | null> {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return client ? toClientDomain(client) : null;
  }
}
