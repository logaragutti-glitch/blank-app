import type { BestValueSupplier, BudgetAnalysis, BudgetLineItem } from "@eve-os/types";

export interface UpsertBudgetAnalysisInput {
  lineItems: BudgetLineItem[];
  bestValueSuppliers: BestValueSupplier[];
  materialsCost: number;
  suppliersCost: number;
  totalEstimatedCost: number;
  margin: number | null;
  fitsBudget: boolean | null;
  hasIncompleteData: boolean;
}

export abstract class BudgetAnalysisRepository {
  /** One record per proposal (unique on proposalId) — regenerating replaces it wholesale. */
  abstract upsert(proposalId: string, input: UpsertBudgetAnalysisInput): Promise<BudgetAnalysis>;
  abstract findByProposal(proposalId: string): Promise<BudgetAnalysis | null>;
}
