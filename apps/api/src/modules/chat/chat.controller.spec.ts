import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { ChatMessage, Client, Event, ProjectTask, Supplier, User, Venue } from "@eve-os/types";
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
import { EveChatPort } from "./ai/eve-chat.port";
import { ChatController } from "./chat.controller";
import { ChatMessageRepository } from "./repositories/chat-message.repository";

describe("ChatController", () => {
  const authUser: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };
  const fakeEvent = {
    id: "event-1",
    clientId: "client-1",
    venueId: "venue-1",
    type: "WEDDING",
    ceremonyDateTime: null,
    guestsExpected: 100,
    budgetAmount: 26770,
  } as Event;
  const fakeClient = { partnerOneName: "Karen", partnerTwoName: "Daniel" } as Client;
  const fakeVenue = { name: "Villa Massari" } as Venue;
  const fakeUserMessage = { id: "msg-1", eventId: "event-1", role: "USER", content: "Oi" } as ChatMessage;
  const fakeAssistantMessage = {
    id: "msg-2",
    eventId: "event-1",
    role: "ASSISTANT",
    content: "Oi! Como posso ajudar?",
  } as ChatMessage;

  let controller: ChatController;
  let events: jest.Mocked<EventRepository>;
  let clients: jest.Mocked<ClientRepository>;
  let venues: jest.Mocked<VenueRepository>;
  let proposals: jest.Mocked<ProposalRepository>;
  let tasks: jest.Mocked<ProjectTaskRepository>;
  let team: jest.Mocked<ProjectTeamMemberRepository>;
  let users: jest.Mocked<UserRepository>;
  let supplierAssignments: jest.Mocked<ProjectSupplierRepository>;
  let suppliers: jest.Mocked<SupplierRepository>;
  let messages: jest.Mocked<ChatMessageRepository>;
  let eveChat: jest.Mocked<EveChatPort>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: EventRepository, useValue: { findById: jest.fn(), findAll: jest.fn(), create: jest.fn() } },
        { provide: ClientRepository, useValue: { findById: jest.fn(), findByOrganization: jest.fn(), create: jest.fn() } },
        { provide: VenueRepository, useValue: { findById: jest.fn(), findAll: jest.fn(), create: jest.fn(), update: jest.fn() } },
        {
          provide: ProposalRepository,
          useValue: { findByEvent: jest.fn(), findById: jest.fn(), create: jest.fn(), updateConceptName: jest.fn(), updateStatus: jest.fn() },
        },
        { provide: ProjectTaskRepository, useValue: { findByEvent: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn(), softDelete: jest.fn() } },
        { provide: ProjectTeamMemberRepository, useValue: { findByEvent: jest.fn(), findOne: jest.fn(), addOrUpdate: jest.fn(), remove: jest.fn() } },
        { provide: UserRepository, useValue: { findByOrganization: jest.fn() } },
        { provide: ProjectSupplierRepository, useValue: { findByEvent: jest.fn(), findOne: jest.fn(), addOrUpdate: jest.fn(), remove: jest.fn() } },
        {
          provide: SupplierRepository,
          useValue: { findById: jest.fn(), findAll: jest.fn(), create: jest.fn(), update: jest.fn(), setVenuePreference: jest.fn(), appendPerformanceNote: jest.fn() },
        },
        { provide: ChatMessageRepository, useValue: { findByEvent: jest.fn(), create: jest.fn() } },
        { provide: EveChatPort, useValue: { reply: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(ChatController);
    events = moduleRef.get(EventRepository);
    clients = moduleRef.get(ClientRepository);
    venues = moduleRef.get(VenueRepository);
    proposals = moduleRef.get(ProposalRepository);
    tasks = moduleRef.get(ProjectTaskRepository);
    team = moduleRef.get(ProjectTeamMemberRepository);
    users = moduleRef.get(UserRepository);
    supplierAssignments = moduleRef.get(ProjectSupplierRepository);
    suppliers = moduleRef.get(SupplierRepository);
    messages = moduleRef.get(ChatMessageRepository);
    eveChat = moduleRef.get(EveChatPort);

    events.findById.mockResolvedValue(fakeEvent);
    clients.findById.mockResolvedValue(fakeClient);
    venues.findById.mockResolvedValue(fakeVenue);
    proposals.findByEvent.mockResolvedValue([]);
    tasks.findByEvent.mockResolvedValue([]);
    team.findByEvent.mockResolvedValue([]);
    users.findByOrganization.mockResolvedValue([]);
    supplierAssignments.findByEvent.mockResolvedValue([]);
  });

  describe("listMessages", () => {
    it("returns the event's transcript", async () => {
      messages.findByEvent.mockResolvedValue([fakeUserMessage, fakeAssistantMessage]);

      const result = await controller.listMessages(authUser, "event-1");

      expect(messages.findByEvent).toHaveBeenCalledWith("event-1");
      expect(result).toEqual([fakeUserMessage, fakeAssistantMessage]);
    });

    it("throws NotFoundException when the event doesn't exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.listMessages(authUser, "missing")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("sendMessage", () => {
    it("persists the user message, replies grounded in real context, and persists the reply", async () => {
      messages.findByEvent.mockResolvedValue([]);
      messages.create
        .mockResolvedValueOnce(fakeUserMessage)
        .mockResolvedValueOnce(fakeAssistantMessage);
      eveChat.reply.mockResolvedValue("Oi! Como posso ajudar?");

      const result = await controller.sendMessage(authUser, "event-1", { content: "Oi" });

      expect(messages.create).toHaveBeenNthCalledWith(1, {
        tenantId: "tenant-1",
        organizationId: "org-1",
        eventId: "event-1",
        role: "USER",
        content: "Oi",
        createdBy: "user-1",
      });
      const chatCall = eveChat.reply.mock.calls[0]?.[0];
      expect(chatCall?.question).toBe("Oi");
      expect(chatCall?.context.clientNames).toBe("Karen & Daniel");
      expect(chatCall?.context.venueName).toBe("Villa Massari");
      expect(messages.create).toHaveBeenNthCalledWith(2, {
        tenantId: "tenant-1",
        organizationId: "org-1",
        eventId: "event-1",
        role: "ASSISTANT",
        content: "Oi! Como posso ajudar?",
        createdBy: null,
      });
      expect(result).toEqual({ userMessage: fakeUserMessage, assistantMessage: fakeAssistantMessage });
    });

    it("includes real tasks/team/suppliers in the grounding context", async () => {
      messages.findByEvent.mockResolvedValue([]);
      messages.create.mockResolvedValueOnce(fakeUserMessage).mockResolvedValueOnce(fakeAssistantMessage);
      tasks.findByEvent.mockResolvedValue([
        { title: "Confirmar buffet", status: "TODO", dueDate: null } as ProjectTask,
      ]);
      team.findByEvent.mockResolvedValue([{ eventId: "event-1", userId: "user-2", role: "Decoradora", addedAt: "" }]);
      users.findByOrganization.mockResolvedValue([{ id: "user-2", name: "Karen Decoradora" } as User]);
      supplierAssignments.findByEvent.mockResolvedValue([
        { eventId: "event-1", supplierId: "supplier-1", status: "BOOKED", notes: null, addedAt: "" },
      ]);
      suppliers.findById.mockResolvedValue({ id: "supplier-1", name: "Flores da Serra", category: "FLORIST" } as Supplier);
      eveChat.reply.mockResolvedValue("ok");

      await controller.sendMessage(authUser, "event-1", { content: "Quem está na equipe?" });

      const chatCall = eveChat.reply.mock.calls[0]?.[0];
      expect(chatCall?.context.tasks).toEqual([{ title: "Confirmar buffet", status: "TODO", dueDate: null }]);
      expect(chatCall?.context.team).toEqual([{ name: "Karen Decoradora", role: "Decoradora" }]);
      expect(chatCall?.context.suppliers).toEqual([{ name: "Flores da Serra", category: "FLORIST", status: "BOOKED" }]);
    });

    it("throws NotFoundException when the event doesn't exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.sendMessage(authUser, "missing", { content: "Oi" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
