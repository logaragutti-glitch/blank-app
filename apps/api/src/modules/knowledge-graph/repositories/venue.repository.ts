import type { Venue } from "@eve-os/types";

export abstract class VenueRepository {
  abstract findAll(organizationId: string): Promise<Venue[]>;
  abstract findById(organizationId: string, id: string): Promise<Venue | null>;
}
