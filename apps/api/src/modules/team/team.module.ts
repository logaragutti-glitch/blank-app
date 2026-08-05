import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { TeamController } from "./team.controller";
import { PrismaProjectTeamMemberRepository } from "./repositories/prisma-project-team-member.repository";
import { ProjectTeamMemberRepository } from "./repositories/project-team-member.repository";

// UserRepository comes from the global AuthModule — not imported here.
@Module({
  imports: [BriefingModule],
  controllers: [TeamController],
  providers: [{ provide: ProjectTeamMemberRepository, useClass: PrismaProjectTeamMemberRepository }],
  exports: [ProjectTeamMemberRepository],
})
export class TeamModule {}
