// Not part of @eve-os/types: a lightweight membership record (event +
// supplier + status), not a shared domain entity with its own audit
// trail — same reasoning as ProjectTeamMember/VenuePreferredSupplier.
export type ProjectSupplierStatus = "CONTACTED" | "NEGOTIATING" | "BOOKED" | "CANCELLED";

export interface ProjectSupplier {
  eventId: string;
  supplierId: string;
  status: ProjectSupplierStatus;
  notes: string | null;
  addedAt: string;
}

export interface AddProjectSupplierInput {
  supplierId: string;
  status: ProjectSupplierStatus;
  notes?: string | null;
}

export abstract class ProjectSupplierRepository {
  abstract findByEvent(eventId: string): Promise<ProjectSupplier[]>;
  abstract findOne(eventId: string, supplierId: string): Promise<ProjectSupplier | null>;
  // Upsert semantics: assigning a supplier already on the project just
  // updates its status/notes instead of rejecting — moving a supplier
  // from "Em negociação" to "Contratado" shouldn't require removing and
  // re-adding it.
  abstract addOrUpdate(eventId: string, input: AddProjectSupplierInput): Promise<ProjectSupplier>;
  abstract remove(eventId: string, supplierId: string): Promise<void>;
}
