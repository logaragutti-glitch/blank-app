import type { DiagnosticoCriativo } from "@eve-os/types";

export interface BudgetAnalysisEventContext {
  type: string;
  guestsExpected: number | null;
}

/** Only materials with a real, known catalog cost are ever offered here — Agente 4 never invents a cost. */
export interface BudgetAnalysisMaterialContext {
  name: string;
  category: string;
}

export interface BudgetAnalysisInput {
  conceptName: string;
  event: BudgetAnalysisEventContext;
  diagnostico: DiagnosticoCriativo;
  catalogMaterials: BudgetAnalysisMaterialContext[];
}

export interface BudgetAnalysisMaterialEstimate {
  materialName: string;
  estimatedQuantity: number;
}

export interface BudgetAnalysisResult {
  materialEstimates: BudgetAnalysisMaterialEstimate[];
}

/**
 * Port for Agente 4 (Diretor de Produção, 04-ai-bible.md)'s budget
 * analysis. Only estimates realistic quantities needed per material, given
 * the guest count and concept — cost math (unit cost × quantity, supplier
 * ranking, margin, budget fit) is computed deterministically afterward from
 * real Knowledge Graph data, never by the model.
 */
export abstract class BudgetAnalysisPort {
  abstract generate(input: BudgetAnalysisInput): Promise<BudgetAnalysisResult>;
}
