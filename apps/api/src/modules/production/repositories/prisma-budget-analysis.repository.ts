import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { BudgetAnalysis } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toBudgetAnalysisDomain } from "../mappers/budget-analysis.mapper";
import { BudgetAnalysisRepository, type UpsertBudgetAnalysisInput } from "./budget-analysis.repository";

@Injectable()
export class PrismaBudgetAnalysisRepository implements BudgetAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(proposalId: string, input: UpsertBudgetAnalysisInput): Promise<BudgetAnalysis> {
    const lineItems = input.lineItems as unknown as Prisma.InputJsonValue;
    const bestValueSuppliers = input.bestValueSuppliers as unknown as Prisma.InputJsonValue;
    const data = {
      lineItems,
      bestValueSuppliers,
      materialsCost: input.materialsCost,
      suppliersCost: input.suppliersCost,
      totalEstimatedCost: input.totalEstimatedCost,
      margin: input.margin ?? undefined,
      fitsBudget: input.fitsBudget,
      hasIncompleteData: input.hasIncompleteData,
    };

    const analysis = await this.prisma.budgetAnalysis.upsert({
      where: { proposalId },
      create: { proposalId, ...data },
      update: data,
    });
    return toBudgetAnalysisDomain(analysis);
  }

  async findByProposal(proposalId: string): Promise<BudgetAnalysis | null> {
    const analysis = await this.prisma.budgetAnalysis.findUnique({ where: { proposalId } });
    return analysis ? toBudgetAnalysisDomain(analysis) : null;
  }
}
