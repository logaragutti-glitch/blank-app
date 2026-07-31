import type { Event, EventType } from "@eve-os/types";

export interface CreateEventInput {
  tenantId: string;
  organizationId: string;
  clientId: string;
  venueId: string;
  type?: EventType;
  guestsExpected?: number | null;
  ceremonyDateTime?: Date | null;
  budgetAmount?: number | null;
}

export abstract class EventRepository {
  abstract create(input: CreateEventInput): Promise<Event>;
  abstract findById(organizationId: string, id: string): Promise<Event | null>;
  /** Most recent first — backs the project list / Home screen. */
  abstract findAll(organizationId: string): Promise<Event[]>;
}
