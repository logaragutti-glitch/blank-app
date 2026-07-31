/** One material line item in the budget analysis — quantity is Agente 4's judgment call, cost math is deterministic. */
export interface BudgetLineItem {
  materialName: string;
  category: string;
  estimatedQuantity: number;
  /** Always known — only materials with a real catalog cost are ever offered to Agente 4 for estimation. */
  unitCost: number;
  lineTotal: number;
}

/** The cheapest supplier found (with a known cost) for a given service category. */
export interface BestValueSupplier {
  category: string;
  supplierId: string;
  supplierName: string;
  estimatedCost: number;
}

/**
 * Agente 4 (Diretor de Produção, 04-ai-bible.md) budget analysis — answers
 * "cabe no orçamento?", "qual margem?", "qual fornecedor tem melhor custo-
 * benefício?" using only real cost data from the Knowledge Graph (Material.
 * estimatedUnitCost, Supplier.estimatedCost); never fabricates a number.
 * One per Proposal (regenerating replaces it wholesale), not an
 * AuditedEntity of its own — same pattern as ProductionPlan.
 */
export interface BudgetAnalysis {
  id: string;
  proposalId: string;
  createdAt: string;
  lineItems: BudgetLineItem[];
  bestValueSuppliers: BestValueSupplier[];
  materialsCost: number;
  suppliersCost: number;
  totalEstimatedCost: number;
  /** Proposal.investmentAmount - totalEstimatedCost — null when investmentAmount hasn't been set yet. */
  margin: number | null;
  /** totalEstimatedCost <= Event.budgetAmount — null when no approved budget figure exists to compare against. */
  fitsBudget: boolean | null;
  /**
   * True when the catalog didn't have enough costed materials/suppliers to
   * cover everything this event actually needs — the numbers above are a
   * partial picture, not a complete one, when this is true.
   */
  hasIncompleteData: boolean;
}
