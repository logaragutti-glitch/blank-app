import type { SupplierPerformanceReview } from "@eve-os/types";

export interface UpsertSupplierPerformanceReviewInput {
  overallRating?: number | null;
  qualityRating?: number | null;
  punctualityRating?: number | null;
  communicationRating?: number | null;
  scopeFulfillment?: number | null;
  notes?: string | null;
  createdBy: string | null;
}

export abstract class SupplierPerformanceReviewRepository {
  abstract findByEvent(eventId: string): Promise<SupplierPerformanceReview[]>;
  abstract findByEventAndSupplier(eventId: string, supplierId: string): Promise<SupplierPerformanceReview | null>;
  abstract upsert(
    tenantId: string,
    organizationId: string,
    eventId: string,
    supplierId: string,
    input: UpsertSupplierPerformanceReviewInput,
  ): Promise<SupplierPerformanceReview>;
}
