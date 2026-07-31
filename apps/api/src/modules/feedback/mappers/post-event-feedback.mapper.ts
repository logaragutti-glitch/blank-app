import type { PostEventFeedback as PostEventFeedbackPrismaModel } from "@prisma/client";
import type { PostEventFeedback, SupplierPerformanceEntry } from "@eve-os/types";

export function toPostEventFeedbackDomain(model: PostEventFeedbackPrismaModel): PostEventFeedback {
  return {
    id: model.id,
    eventId: model.eventId,
    createdAt: model.createdAt.toISOString(),
    whatDelighted: model.whatDelighted,
    setupAdjustments: model.setupAdjustments,
    supplierPerformance: model.supplierPerformance as unknown as SupplierPerformanceEntry[] | null,
    whatWorkedForSpaceType: model.whatWorkedForSpaceType,
  };
}
