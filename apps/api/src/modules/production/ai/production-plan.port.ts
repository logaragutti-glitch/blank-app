import type { DiagnosticoCriativo } from "@eve-os/types";

export interface ProductionPlanEventContext {
  type: string;
  guestsExpected: number | null;
  ceremonyDateTime: string | null;
}

export interface ProductionPlanVenueContext {
  name: string;
  recommendationNotes: string[];
  structuralConstraints: string | null;
}

/** A catalog material Agente 4 may draw the materials list from — never invents beyond this list. */
export interface ProductionPlanMaterialContext {
  name: string;
  category: string;
}

export interface ProductionPlanInput {
  conceptName: string;
  event: ProductionPlanEventContext;
  venue: ProductionPlanVenueContext;
  diagnostico: DiagnosticoCriativo;
  catalogMaterials: ProductionPlanMaterialContext[];
}

export interface MaterialListItemResult {
  name: string;
  category: string;
  quantity: string;
  notes?: string;
}

export interface SetupScheduleStepResult {
  label: string;
  timing: string;
  durationEstimate: string;
  description: string;
}

export interface ChecklistItemResult {
  label: string;
  category: string;
  description?: string;
}

export interface ProductionPlanResult {
  materialsList: MaterialListItemResult[];
  setupSchedule: SetupScheduleStepResult[];
  checklist: ChecklistItemResult[];
}

/**
 * Port for Agente 4 / Diretor de Produção (04-ai-bible.md) — turns an
 * already-diagnosed Proposal into the materials list, day-of assembly
 * schedule, and operational checklist needed to actually produce the event.
 */
export abstract class ProductionPlanPort {
  abstract generate(input: ProductionPlanInput): Promise<ProductionPlanResult>;
}
