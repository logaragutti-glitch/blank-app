import { Test } from "@nestjs/testing";
import type { Event, Venue, Client, Proposal } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { ClientRepository } from "../briefing/repositories/client.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProposalRepository } from "../creative/repositories/proposal.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { ProjectsController } from "./projects.controller";

describe("ProjectsController", () => {
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };

  let controller: ProjectsController;
  let events: jest.Mocked<EventRepository>;
  let clients: jest.Mocked<ClientRepository>;
  let venues: jest.Mocked<VenueRepository>;
  let proposals: jest.Mocked<ProposalRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: EventRepository, useValue: { create: jest.fn(), findById: jest.fn(), findAll: jest.fn() } },
        { provide: ClientRepository, useValue: { create: jest.fn(), findById: jest.fn() } },
        { provide: VenueRepository, useValue: { findAll: jest.fn(), findById: jest.fn() } },
        {
          provide: ProposalRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEvent: jest.fn(),
            updateConceptName: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(ProjectsController);
    events = moduleRef.get(EventRepository);
    clients = moduleRef.get(ClientRepository);
    venues = moduleRef.get(VenueRepository);
    proposals = moduleRef.get(ProposalRepository);
  });

  it("assembles a project summary per event, with the latest proposal when one exists", async () => {
    events.findAll.mockResolvedValue([
      { id: "event-1", clientId: "client-1", venueId: "venue-1" } as Event,
      { id: "event-2", clientId: "client-2", venueId: "venue-2" } as Event,
    ]);
    clients.findById.mockImplementation(async (_org, id) =>
      id === "client-1"
        ? ({ partnerOneName: "Karen", partnerTwoName: "Daniel" } as Client)
        : ({ partnerOneName: "Iris", partnerTwoName: null } as Client),
    );
    venues.findById.mockResolvedValue({ name: "Villa Massari" } as Venue);
    proposals.findByEvent.mockImplementation(async (_org, eventId) =>
      eventId === "event-1"
        ? [{ id: "proposal-1", status: "DRAFT", conceptName: "Jardim Atemporal", wowScore: 82 } as Proposal]
        : [],
    );

    const result = await controller.listProjects(user);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      eventId: "event-1",
      clientNames: "Karen & Daniel",
      venueName: "Villa Massari",
      latestProposal: { id: "proposal-1", status: "DRAFT", conceptName: "Jardim Atemporal", wowScore: 82 },
    });
    expect(result[1]).toMatchObject({
      eventId: "event-2",
      clientNames: "Iris",
      latestProposal: null,
    });
  });
});
