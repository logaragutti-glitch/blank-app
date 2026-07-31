import type { PostEventFeedback, SupplierPerformanceEntry } from "@eve-os/types";

export interface UpsertPostEventFeedbackInput {
  whatDelighted?: string | null;
  setupAdjustments?: string | null;
  supplierPerformance?: SupplierPerformanceEntry[] | null;
  whatWorkedForSpaceType?: string | null;
}

export abstract class PostEventFeedbackRepository {
  /** One record per event (unique on eventId) — creates it on first call, replaces the fields on later calls. */
  abstract upsert(eventId: string, input: UpsertPostEventFeedbackInput): Promise<PostEventFeedback>;
  abstract findByEvent(eventId: string): Promise<PostEventFeedback | null>;
}
