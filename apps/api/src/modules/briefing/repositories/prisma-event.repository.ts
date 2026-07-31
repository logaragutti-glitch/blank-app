import { Injectable } from "@nestjs/common";
import type { Event } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toEventDomain } from "../mappers/event.mapper";
import { EventRepository, type CreateEventInput } from "./event.repository";

@Injectable()
export class PrismaEventRepository implements EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateEventInput): Promise<Event> {
    const event = await this.prisma.event.create({ data: input });
    return toEventDomain(event);
  }

  async findById(organizationId: string, id: string): Promise<Event | null> {
    const event = await this.prisma.event.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return event ? toEventDomain(event) : null;
  }

  async findAll(organizationId: string): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return events.map(toEventDomain);
  }
}
