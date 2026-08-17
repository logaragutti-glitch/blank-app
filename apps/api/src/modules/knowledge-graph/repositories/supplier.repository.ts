import type { Supplier, SupplierCategory } from "@eve-os/types";

export interface CreateSupplierInput {
  name: string;
  category: SupplierCategory;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagramUrl?: string | null;
  serviceArea?: string[];
  sourceUrl?: string | null;
  validationLevel?: string | null;
  contactStatus?: string;
  performanceNotes: string | null | undefined;
  estimatedCost: number | null | undefined;
  createdBy: string | null;
}

export interface UpdateSupplierInput {
  name?: string;
  category?: SupplierCategory;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagramUrl?: string | null;
  serviceArea?: string[];
  sourceUrl?: string | null;
  validationLevel?: string | null;
  contactStatus?: string;
  performanceNotes?: string | null;
  estimatedCost?: number | null;
  updatedBy: string | null;
}

export interface SupplierCatalogCategoryRecord {
  id: string;
  slug: string;
  name: string;
  categoryType: string;
  listedProductCount: number | null;
  sourceUrl: string;
  productNames: string[];
  extractionStatus: string;
  notes: string | null;
  sourceCapturedAt: Date;
}

export abstract class SupplierRepository {
  abstract findAll(organizationId: string): Promise<Supplier[]>;
  abstract findById(organizationId: string, id: string): Promise<Supplier | null>;
  abstract findCatalog(organizationId: string, supplierId: string): Promise<SupplierCatalogCategoryRecord[] | null>;
  // preferredVenueIds is deliberately not manageable here — that's driven
  // by real post-event feedback (see setVenuePreference below), not a
  // manual admin field.
  abstract create(tenantId: string, organizationId: string, input: CreateSupplierInput): Promise<Supplier>;
  abstract update(id: string, input: UpdateSupplierInput): Promise<Supplier>;

  // Marks (or unmarks) a supplier as preferred at a venue — used by the
  // post-event feedback loop to promote/demote suppliers automatically
  // based on structured performance ratings (see FeedbackController).
  abstract setVenuePreference(venueId: string, supplierId: string, preferred: boolean): Promise<void>;

  // Appends a line to the supplier's free-text performance notes — never
  // overwrites prior history, since this is meant to accumulate real
  // feedback over time, one event at a time.
  abstract appendPerformanceNote(supplierId: string, note: string): Promise<void>;

  // See VenueRepository.addPhotoKey/removePhotoKey for why this is a
  // separate pair of methods rather than folded into update().
  abstract addPhotoKey(id: string, key: string): Promise<Supplier>;
  abstract removePhotoKey(id: string, key: string): Promise<Supplier>;
}
