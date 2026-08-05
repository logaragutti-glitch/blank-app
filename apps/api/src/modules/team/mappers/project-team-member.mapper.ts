import type { ProjectTeamMember as ProjectTeamMemberPrismaModel } from "@prisma/client";
import type { ProjectTeamMember } from "../repositories/project-team-member.repository";

export function toProjectTeamMemberDomain(model: ProjectTeamMemberPrismaModel): ProjectTeamMember {
  return {
    eventId: model.eventId,
    userId: model.userId,
    role: model.role,
    addedAt: model.addedAt.toISOString(),
  };
}
