import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toProjectTeamMemberDomain } from "../mappers/project-team-member.mapper";
import {
  ProjectTeamMemberRepository,
  type AddTeamMemberInput,
  type ProjectTeamMember,
} from "./project-team-member.repository";

@Injectable()
export class PrismaProjectTeamMemberRepository implements ProjectTeamMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEvent(eventId: string): Promise<ProjectTeamMember[]> {
    const members = await this.prisma.projectTeamMember.findMany({
      where: { eventId },
      orderBy: { addedAt: "asc" },
    });
    return members.map(toProjectTeamMemberDomain);
  }

  async findOne(eventId: string, userId: string): Promise<ProjectTeamMember | null> {
    const member = await this.prisma.projectTeamMember.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    return member ? toProjectTeamMemberDomain(member) : null;
  }

  async addOrUpdate(eventId: string, input: AddTeamMemberInput): Promise<ProjectTeamMember> {
    const member = await this.prisma.projectTeamMember.upsert({
      where: { eventId_userId: { eventId, userId: input.userId } },
      create: { eventId, userId: input.userId, role: input.role },
      update: { role: input.role },
    });
    return toProjectTeamMemberDomain(member);
  }

  async remove(eventId: string, userId: string): Promise<void> {
    await this.prisma.projectTeamMember.delete({ where: { eventId_userId: { eventId, userId } } });
  }
}
