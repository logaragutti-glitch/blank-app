import type { ProposalComponent as ProposalComponentPrismaModel } from "@prisma/client";
import type { ComponentType, ProposalComponent } from "@eve-os/types";

export function toProposalComponentDomain(model: ProposalComponentPrismaModel): ProposalComponent {
  return {
    id: model.id,
    proposalId: model.proposalId,
    type: model.type as ComponentType,
    order: model.order,
    content: model.content as Record<string, unknown>,
  };
}
