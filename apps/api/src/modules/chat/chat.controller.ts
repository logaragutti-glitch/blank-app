import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { UserRepository } from "../auth/repositories/user.repository";
import { ClientRepository } from "../briefing/repositories/client.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProposalRepository } from "../creative/repositories/proposal.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { ProjectSupplierRepository } from "../project-suppliers/repositories/project-supplier.repository";
import { ProjectTaskRepository } from "../tasks/repositories/project-task.repository";
import { ProjectTeamMemberRepository } from "../team/repositories/project-team-member.repository";
import { EveChatPort, type EveChatProjectContext } from "./ai/eve-chat.port";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";
import { ChatMessageRepository } from "./repositories/chat-message.repository";

// Chat com a EVE (Bucket C) — a per-project conversational Q&A companion,
// grounded strictly in real data already in the system. Not yet an agent:
// it cannot create tasks, change statuses, or write anything (see
// EVE_CHAT_SYSTEM_PROMPT) — that's a materially bigger, separate feature.
@ApiTags("chat")
@ApiBearerAuth()
@Controller("events/:eventId/chat/messages")
export class ChatController {
  constructor(
    private readonly events: EventRepository,
    private readonly clients: ClientRepository,
    private readonly venues: VenueRepository,
    private readonly proposals: ProposalRepository,
    private readonly tasks: ProjectTaskRepository,
    private readonly team: ProjectTeamMemberRepository,
    private readonly users: UserRepository,
    private readonly supplierAssignments: ProjectSupplierRepository,
    private readonly suppliers: SupplierRepository,
    private readonly messages: ChatMessageRepository,
    private readonly eveChat: EveChatPort,
  ) {}

  @Get()
  async listMessages(@CurrentUser() user: AuthenticatedUser, @Param("eventId") eventId: string) {
    const event = await this.events.findById(user.organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");

    return this.messages.findByEvent(eventId);
  }

  @Post()
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Body() dto: SendChatMessageDto,
  ) {
    const event = await this.events.findById(user.organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");

    const priorMessages = await this.messages.findByEvent(eventId);

    const userMessage = await this.messages.create({
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      eventId,
      role: "USER",
      content: dto.content,
      createdBy: user.sub,
    });

    const context = await this.buildContext(user.organizationId, eventId);
    const replyText = await this.eveChat.reply({
      context,
      history: priorMessages.map((m) => ({ role: m.role, content: m.content })),
      question: dto.content,
    });

    const assistantMessage = await this.messages.create({
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      eventId,
      role: "ASSISTANT",
      content: replyText,
      createdBy: null,
    });

    return { userMessage, assistantMessage };
  }

  // Composes real, already-captured data into the shape EveChatPort
  // expects — same "assemble across repositories" pattern ProjectsController
  // uses for the Home read model and Canvas do Evento, not a new
  // capability of its own.
  private async buildContext(organizationId: string, eventId: string): Promise<EveChatProjectContext> {
    const event = await this.events.findById(organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");

    const [client, venue, eventProposals, tasks, teamAssignments, orgUsers, supplierAssignments] = await Promise.all([
      this.clients.findById(organizationId, event.clientId),
      this.venues.findById(organizationId, event.venueId),
      this.proposals.findByEvent(organizationId, eventId),
      this.tasks.findByEvent(eventId),
      this.team.findByEvent(eventId),
      this.users.findByOrganization(organizationId),
      this.supplierAssignments.findByEvent(eventId),
    ]);
    const latestProposal = eventProposals[0] ?? null;
    const usersById = new Map(orgUsers.map((u) => [u.id, u]));

    const suppliersById = new Map(
      (
        await Promise.all(supplierAssignments.map((assignment) => this.suppliers.findById(organizationId, assignment.supplierId)))
      )
        .filter((supplier): supplier is NonNullable<typeof supplier> => supplier !== null)
        .map((supplier) => [supplier.id, supplier] as const),
    );

    return {
      clientNames: client
        ? [client.partnerOneName, client.partnerTwoName].filter(Boolean).join(" & ")
        : "Cliente não encontrado",
      eventType: event.type,
      ceremonyDateTime: event.ceremonyDateTime,
      guestsExpected: event.guestsExpected,
      budgetAmount: event.budgetAmount,
      venueName: venue?.name ?? null,
      latestProposal: latestProposal
        ? { status: latestProposal.status, conceptName: latestProposal.conceptName, wowScore: latestProposal.wowScore }
        : null,
      tasks: tasks.map((task) => ({ title: task.title, status: task.status, dueDate: task.dueDate })),
      team: teamAssignments.map((assignment) => ({
        name: usersById.get(assignment.userId)?.name ?? "Usuário removido",
        role: assignment.role,
      })),
      suppliers: supplierAssignments.map((assignment) => ({
        name: suppliersById.get(assignment.supplierId)?.name ?? "Fornecedor removido",
        category: suppliersById.get(assignment.supplierId)?.category ?? "",
        status: assignment.status,
      })),
    };
  }
}
