import type { ProductionPlan as ProductionPlanPrismaModel } from "@prisma/client";
import type { ChecklistItem, MaterialListItem, ProductionPlan, SetupScheduleStep } from "@eve-os/types";

export function toProductionPlanDomain(model: ProductionPlanPrismaModel): ProductionPlan {
  return {
    id: model.id,
    proposalId: model.proposalId,
    createdAt: model.createdAt.toISOString(),
    materialsList: model.materialsList as unknown as MaterialListItem[],
    setupSchedule: model.setupSchedule as unknown as SetupScheduleStep[],
    checklist: model.checklist as unknown as ChecklistItem[],
  };
}
