import { Injectable } from "@nestjs/common";
import type { EventStyle } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toEventStyleDomain } from "../mappers/event-style.mapper";
import { EventStyleRepository } from "./event-style.repository";

@Injectable()
export class PrismaEventStyleRepository implements EventStyleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<EventStyle[]> {
    const styles = await this.prisma.eventStyle.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return styles.map(toEventStyleDomain);
  }

  async findById(organizationId: string, id: string): Promise<EventStyle | null> {
    const style = await this.prisma.eventStyle.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return style ? toEventStyleDomain(style) : null;
  }
}
