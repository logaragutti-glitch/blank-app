import type { Venue } from "@eve-os/types";

export interface CreateVenueInput {
  name: string;
  structuralConstraints: string | null | undefined;
  ceilingHeightMeters: number | null | undefined;
  powerOutlets: number | null | undefined;
  guestCapacity: number | null | undefined;
  existingFurniture: unknown;
  typicalClimate: string | null | undefined;
  recommendationNotes: string[];
  createdBy: string | null;
}

export interface UpdateVenueInput {
  name?: string;
  structuralConstraints?: string | null;
  ceilingHeightMeters?: number | null;
  powerOutlets?: number | null;
  guestCapacity?: number | null;
  existingFurniture?: unknown;
  typicalClimate?: string | null;
  recommendationNotes?: string[];
  updatedBy: string | null;
}

export abstract class VenueRepository {
  abstract findAll(organizationId: string): Promise<Venue[]>;
  abstract findById(organizationId: string, id: string): Promise<Venue | null>;
  abstract create(tenantId: string, organizationId: string, input: CreateVenueInput): Promise<Venue>;
  abstract update(id: string, input: UpdateVenueInput): Promise<Venue>;
}
