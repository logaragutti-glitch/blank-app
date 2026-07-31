import type { Supplier } from "@eve-os/types";

export abstract class SupplierRepository {
  abstract findAll(organizationId: string): Promise<Supplier[]>;
  abstract findById(organizationId: string, id: string): Promise<Supplier | null>;

  // Marks (or unmarks) a supplier as preferred at a venue — used by the
  // post-event feedback loop to promote/demote suppliers automatically
  // based on structured performance ratings (see FeedbackController).
  abstract setVenuePreference(venueId: string, supplierId: string, preferred: boolean): Promise<void>;

  // Appends a line to the supplier's free-text performance notes — never
  // overwrites prior history, since this is meant to accumulate real
  // feedback over time, one event at a time.
  abstract appendPerformanceNote(supplierId: string, note: string): Promise<void>;
}
