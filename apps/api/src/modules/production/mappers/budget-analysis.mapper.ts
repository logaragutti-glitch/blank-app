import type { BudgetAnalysis as BudgetAnalysisPrismaModel } from "@prisma/client";
import type { BestValueSupplier, BudgetAnalysis, BudgetLineItem } from "@eve-os/types";

export function toBudgetAnalysisDomain(model: BudgetAnalysisPrismaModel): BudgetAnalysis {
  return {
    id: model.id,
    proposalId: model.proposalId,
    createdAt: model.createdAt.toISOString(),
    lineItems: model.lineItems as unknown as BudgetLineItem[],
    bestValueSuppliers: model.bestValueSuppliers as unknown as BestValueSupplier[],
    materialsCost: model.materialsCost.toNumber(),
    suppliersCost: model.suppliersCost.toNumber(),
    totalEstimatedCost: model.totalEstimatedCost.toNumber(),
    margin: model.margin ? model.margin.toNumber() : null,
    fitsBudget: model.fitsBudget,
    hasIncompleteData: model.hasIncompleteData,
  };
}
