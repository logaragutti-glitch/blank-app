/** One item of the materials list — grounded in the Knowledge Graph catalog (never invented). */
export interface MaterialListItem {
  name: string;
  category: string;
  /** Free-text quantity (e.g. "40 unidades", "15 buquês médios") — an estimate, not a precise inventory count. */
  quantity: string;
  notes: string | null;
}

/** One step of the day-of assembly/breakdown schedule — distinct from the client-facing TIMELINE proposal component. */
export interface SetupScheduleStep {
  label: string;
  /** Relative timing (e.g. "6h antes da cerimônia"), since a fixed clock time isn't always known. */
  timing: string;
  durationEstimate: string;
  description: string;
}

/** One operational checklist item (fornecedores, equipe, logística...). */
export interface ChecklistItem {
  label: string;
  category: string;
  description: string | null;
}

/**
 * Production Plan (Agente 4 / Diretor de Produção, 04-ai-bible.md) — the
 * materials list, assembly schedule, and operational checklist generated
 * from an already-diagnosed Proposal. Like PostEventFeedback, this is a
 * generated artifact keyed 1:1 to its parent (Proposal) — not an
 * AuditedEntity: no tenant/org scoping of its own (inherited from Proposal)
 * and no soft delete/versioning, since regenerating replaces it wholesale.
 */
export interface ProductionPlan {
  id: string;
  proposalId: string;
  createdAt: string;
  materialsList: MaterialListItem[];
  setupSchedule: SetupScheduleStep[];
  checklist: ChecklistItem[];
}
