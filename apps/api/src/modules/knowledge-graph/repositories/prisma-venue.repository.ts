import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Venue } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toVenueDomain } from "../mappers/venue.mapper";
import { VenueRepository, type CreateVenueInput, type UpdateVenueInput } from "./venue.repository";

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

  async create(tenantId: string, organizationId: string, input: CreateVenueInput): Promise<Venue> {
    const venue = await this.prisma.venue.create({
      data: {
        tenantId,
        organizationId,
        name: input.name,
        structuralConstraints: input.structuralConstraints,
        ceilingHeightMeters: input.ceilingHeightMeters,
        powerOutlets: input.powerOutlets,
        guestCapacity: input.guestCapacity,
        existingFurniture: input.existingFurniture as Prisma.InputJsonValue | undefined,
        typicalClimate: input.typicalClimate,
        recommendationNotes: input.recommendationNotes,
        createdBy: input.createdBy,
      },
    });
    return toVenueDomain(venue);
  }

  async update(id: string, input: UpdateVenueInput): Promise<Venue> {
    const venue = await this.prisma.venue.update({
      where: { id },
      data: {
        name: input.name,
        structuralConstraints: input.structuralConstraints,
        ceilingHeightMeters: input.ceilingHeightMeters,
        powerOutlets: input.powerOutlets,
        guestCapacity: input.guestCapacity,
        existingFurniture: input.existingFurniture as Prisma.InputJsonValue | undefined,
        typicalClimate: input.typicalClimate,
        recommendationNotes: input.recommendationNotes,
        updatedBy: input.updatedBy,
      },
    });
    return toVenueDomain(venue);
  }
}
