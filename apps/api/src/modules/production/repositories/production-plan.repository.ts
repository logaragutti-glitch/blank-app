import type { ProductionPlan } from "@eve-os/types";
import type { ProductionPlanResult } from "../ai/production-plan.port";

export abstract class ProductionPlanRepository {
  /** One record per proposal (unique on proposalId) — regenerating replaces it wholesale. */
  abstract upsert(proposalId: string, input: ProductionPlanResult): Promise<ProductionPlan>;
  abstract findByProposal(proposalId: string): Promise<ProductionPlan | null>;
}
