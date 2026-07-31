/**
 * Feedback -> Knowledge Graph loop (05-database-bible.md, Capitulo 9):
 * "Esse feedback deve realimentar o Knowledge Graph... promovendo/
 * despromovendo fornecedores para determinado tipo de espaco." The only
 * field of PostEventFeedback that is real, structured data suitable for an
 * automatic, non-speculative adjustment is `supplierPerformance` (a 1-5
 * rating the caller already provided) — the other fields are free text and
 * would require an AI to interpret, which risks inventing a signal that
 * was never actually given. This module is deliberately a pure, versioned
 * heuristic (same pattern as wow-score.ts), not an AI call.
 */

export type SupplierPreferenceDecision = "promote" | "demote" | "no-change";

// A high rating (>=4) means the supplier should be preferred at this
// venue going forward; a low rating (<=2) means it should not; a neutral
// rating (3) leaves the existing preference untouched rather than
// asserting a signal the rating doesn't actually carry.
export function decideSupplierPreference(rating: number): SupplierPreferenceDecision {
  if (rating >= 4) return "promote";
  if (rating <= 2) return "demote";
  return "no-change";
}

// Appends a dated line to Supplier.performanceNotes — never invents
// commentary beyond the rating and the caller's own notes.
export function buildPerformanceNote(eventId: string, rating: number, notes: string | undefined, recordedAt: Date): string {
  const date = recordedAt.toISOString().slice(0, 10);
  const base = `[${date}] Feedback do evento ${eventId}: nota ${rating}/5`;
  return notes ? `${base} — ${notes}` : base;
}
