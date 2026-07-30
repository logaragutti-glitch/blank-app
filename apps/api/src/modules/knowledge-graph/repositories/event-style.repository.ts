import type { EventStyle } from "@eve-os/types";

export abstract class EventStyleRepository {
  abstract findAll(organizationId: string): Promise<EventStyle[]>;
  abstract findById(organizationId: string, id: string): Promise<EventStyle | null>;
}
