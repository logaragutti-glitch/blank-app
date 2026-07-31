/** One supplier's performance on a given event (Database Bible Cap. 9). */
export interface SupplierPerformanceEntry {
  supplierId: string;
  /** 1-5. */
  rating: number;
  notes?: string;
}

/**
 * Structured feedback captured after an event (Constitution Capitulo 9) —
 * meant to feed back into the Knowledge Graph over time (e.g. adjusting
 * style compatibility scores or supplier standing), though that automated
 * feedback loop is a separate, not-yet-built capability; this is just the
 * structured capture of it. One per Event (unique on eventId) — not an
 * AuditedEntity: no tenant/org scoping of its own (inherited from Event)
 * and no soft delete/versioning, since it's an append-only record of what
 * happened, not a mutable business entity.
 */
export interface PostEventFeedback {
  id: string;
  eventId: string;
  createdAt: string;
  whatDelighted: string | null;
  setupAdjustments: string | null;
  supplierPerformance: SupplierPerformanceEntry[] | null;
  whatWorkedForSpaceType: string | null;
}
