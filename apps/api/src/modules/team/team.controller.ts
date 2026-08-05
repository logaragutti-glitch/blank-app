import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { UserRepository } from "../auth/repositories/user.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { AddTeamMemberDto } from "./dto/add-team-member.dto";
import { ProjectTeamMemberRepository } from "./repositories/project-team-member.repository";

// Equipe do Projeto (Bucket C) — which of the org's Users (never the
// couple, see Client) is assigned to a given Event, and in what role.
@ApiTags("team")
@ApiBearerAuth()
@Controller("events/:eventId/team")
export class TeamController {
  constructor(
    private readonly events: EventRepository,
    private readonly members: ProjectTeamMemberRepository,
    private readonly users: UserRepository,
  ) {}

  private async requireEvent(organizationId: string, eventId: string) {
    const event = await this.events.findById(organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  // Composed here (not stored) since the member's name/e-mail belongs to
  // User, not to the join record — same reasoning ProjectsController uses
  // to attach client/venue names to an event.
  @Get()
  async listTeam(@CurrentUser() user: AuthenticatedUser, @Param("eventId") eventId: string) {
    await this.requireEvent(user.organizationId, eventId);
    const [assignments, orgUsers] = await Promise.all([
      this.members.findByEvent(eventId),
      this.users.findByOrganization(user.organizationId),
    ]);
    const usersById = new Map(orgUsers.map((u) => [u.id, u]));

    return assignments.map((assignment) => {
      const orgUser = usersById.get(assignment.userId);
      return {
        ...assignment,
        name: orgUser?.name ?? "Usuário removido",
        email: orgUser?.email ?? null,
      };
    });
  }

  @Post()
  async addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    await this.requireEvent(user.organizationId, eventId);
    const orgUsers = await this.users.findByOrganization(user.organizationId);
    const orgUser = orgUsers.find((u) => u.id === dto.userId);
    if (!orgUser) throw new BadRequestException("This user isn't a member of your organization");

    const assignment = await this.members.addOrUpdate(eventId, { userId: dto.userId, role: dto.role });
    return { ...assignment, name: orgUser.name, email: orgUser.email };
  }

  @Delete(":userId")
  @HttpCode(204)
  async removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Param("userId") userId: string,
  ) {
    await this.requireEvent(user.organizationId, eventId);
    const existing = await this.members.findOne(eventId, userId);
    if (!existing) throw new NotFoundException("This user isn't assigned to this project");

    await this.members.remove(eventId, userId);
  }
}
