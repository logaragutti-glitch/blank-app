import { Injectable } from "@nestjs/common";
import type { Venue } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toVenueDomain } from "../mappers/venue.mapper";
import { VenueRepository } from "./venue.repository";

@Injectable()
export class PrismaVenueRepository implements VenueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<Venue[]> {
    const venues = await this.prisma.venue.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return venues.map(toVenueDomain);
  }

  async findById(organizationId: string, id: string): Promise<Venue | null> {
    const venue = await this.prisma.venue.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return venue ? toVenueDomain(venue) : null;
  }
}
