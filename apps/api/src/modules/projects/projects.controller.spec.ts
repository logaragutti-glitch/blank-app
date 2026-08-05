import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { DiagnosticoCriativo, Event, Venue, Client, Material, Proposal, Supplier } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { ClientRepository } from "../briefing/repositories/client.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProposalRepository } from "../creative/repositories/proposal.repository";
import { MaterialRepository } from "../knowledge-graph/repositories/material.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { ProjectsController } from "./projects.controller";

function buildDiagnostico(overrides: Partial<DiagnosticoCriativo> = {}): DiagnosticoCriativo {
  return {
    perfilCasal: "Romântico contemporâneo",
    atmosferaDesejada: "Elegância leve e acolhedora",
    estiloPredominante: "Garden Fine Art",
    paletaSugerida: ["rosé", "verde sálvia"],
    mobiliarioSugerido: ["Madeira Clara"],
    iluminacaoSugerida: "Luz quente e velas",
    materiaisRecomendados: ["Peônia"],
    compatibilidadeComEspaco: "A Villa Massari favorece cerimônia externa.",
    justificativa: "O casal indicou preferência natural e romântica.",
    promptVersion: "v1",
    ...overrides,
  };
}

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
  let materials: jest.Mocked<MaterialRepository>;
  let suppliers: jest.Mocked<SupplierRepository>;

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
        { provide: MaterialRepository, useValue: { findAll: jest.fn(), findById: jest.fn() } },
        {
          provide: SupplierRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            setVenuePreference: jest.fn(),
            appendPerformanceNote: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(ProjectsController);
    events = moduleRef.get(EventRepository);
    clients = moduleRef.get(ClientRepository);
    venues = moduleRef.get(VenueRepository);
    proposals = moduleRef.get(ProposalRepository);
    materials = moduleRef.get(MaterialRepository);
    suppliers = moduleRef.get(SupplierRepository);
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
      clientId: "client-1",
      clientNames: "Karen & Daniel",
      venueName: "Villa Massari",
      latestProposal: { id: "proposal-1", status: "DRAFT", conceptName: "Jardim Atemporal", wowScore: 82 },
    });
    expect(result[1]).toMatchObject({
      eventId: "event-2",
      clientId: "client-2",
      clientNames: "Iris",
      latestProposal: null,
    });
  });

  describe("getEventCanvas", () => {
    const eventId = "event-1";
    const fakeEvent = { id: eventId, clientId: "client-1", venueId: "venue-1" } as Event;
    const fakeClient = { partnerOneName: "Karen", partnerTwoName: "Daniel", lifestyleTags: ["Romântico"] } as Client;
    const fakeVenue = { name: "Villa Massari", recommendationNotes: ["cerimônia externa"] } as Venue;
    const peonia = { name: "Peônia", category: "FLOWER", neverRecommend: false } as Material;
    const neon = { name: "Neon", category: "LIGHTING", neverRecommend: true } as Material;
    const madeira = { name: "Madeira Clara", category: "FURNITURE", neverRecommend: false } as Material;
    const rosaInglesa = { name: "Rosa Inglesa", category: "FLOWER", neverRecommend: false } as Material;
    const musicSupplier = {
      id: "supplier-music",
      name: "DJ Villa",
      category: "MUSIC",
      preferredVenueIds: [],
    } as unknown as Supplier;

    it("throws NotFoundException when the event does not exist", async () => {
      events.findById.mockResolvedValue(null);
      await expect(controller.getEventCanvas(user, eventId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("assembles nodes grounded in real data, narrowed by the diagnosis when one exists", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      clients.findById.mockResolvedValue(fakeClient);
      venues.findById.mockResolvedValue(fakeVenue);
      proposals.findByEvent.mockResolvedValue([
        { diagnosticoCriativo: buildDiagnostico() } as Proposal,
      ]);
      materials.findAll.mockResolvedValue([peonia, neon, madeira, rosaInglesa]);
      suppliers.findAll.mockResolvedValue([musicSupplier]);

      const result = await controller.getEventCanvas(user, eventId);

      expect(result.hasDiagnostico).toBe(true);
      const client = result.nodes.find((n) => n.category === "CLIENT");
      expect(client).toMatchObject({ summary: "Karen & Daniel", hasData: true });

      const flowers = result.nodes.find((n) => n.category === "FLOWERS");
      // Narrowed to the diagnosis's materiaisRecomendados ("Peônia") —
      // Rosa Inglesa exists in the catalog but wasn't recommended, so it's
      // excluded; the never-recommend Neon is never offered regardless.
      expect(flowers?.items).toEqual(["Peônia"]);
      expect(flowers?.hasData).toBe(true);

      const furniture = result.nodes.find((n) => n.category === "FURNITURE");
      expect(furniture?.items).toEqual(["Madeira Clara"]);

      const lighting = result.nodes.find((n) => n.category === "LIGHTING");
      expect(lighting?.summary).toBe("Luz quente e velas");
      expect(lighting?.items).not.toContain("Neon");

      const music = result.nodes.find((n) => n.category === "MUSIC");
      expect(music?.items).toEqual(["DJ Villa"]);
      expect(music?.hasData).toBe(true);

      const catering = result.nodes.find((n) => n.category === "CATERING");
      expect(catering?.hasData).toBe(false);
      expect(catering?.items).toEqual([]);

      const experience = result.nodes.find((n) => n.category === "EXPERIENCE");
      expect(experience?.summary).toBe("Elegância leve e acolhedora");
    });

    it("flags every diagnosis-derived node as having no data when there is no Proposal yet", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      clients.findById.mockResolvedValue(fakeClient);
      venues.findById.mockResolvedValue(fakeVenue);
      proposals.findByEvent.mockResolvedValue([]);
      materials.findAll.mockResolvedValue([peonia, madeira]);
      suppliers.findAll.mockResolvedValue([]);

      const result = await controller.getEventCanvas(user, eventId);

      expect(result.hasDiagnostico).toBe(false);
      // No diagnosis to narrow by, so the full usable catalog is shown.
      expect(result.nodes.find((n) => n.category === "FLOWERS")?.items).toEqual(["Peônia"]);
      const lighting = result.nodes.find((n) => n.category === "LIGHTING");
      expect(lighting?.hasData).toBe(false);
      const experience = result.nodes.find((n) => n.category === "EXPERIENCE");
      expect(experience?.hasData).toBe(false);
    });

    it("prefers suppliers already marked preferred at this event's venue", async () => {
      events.findById.mockResolvedValue(fakeEvent);
      clients.findById.mockResolvedValue(fakeClient);
      venues.findById.mockResolvedValue(fakeVenue);
      proposals.findByEvent.mockResolvedValue([]);
      materials.findAll.mockResolvedValue([]);
      suppliers.findAll.mockResolvedValue([
        {
          id: "supplier-1",
          name: "Buffet Genérico",
          category: "CATERING",
          preferredVenueIds: [],
        } as unknown as Supplier,
        {
          id: "supplier-2",
          name: "Buffet da Villa",
          category: "CATERING",
          preferredVenueIds: ["venue-1"],
        } as unknown as Supplier,
      ]);

      const result = await controller.getEventCanvas(user, eventId);

      expect(result.nodes.find((n) => n.category === "CATERING")?.items).toEqual(["Buffet da Villa"]);
    });
  });
});
