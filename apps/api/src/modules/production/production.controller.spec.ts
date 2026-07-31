import { BadRequestException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Event, Material, ProductionPlan, Proposal, Venue } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProposalRepository } from "../creative/repositories/proposal.repository";
import { MaterialRepository } from "../knowledge-graph/repositories/material.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { ProductionPlanPort } from "./ai/production-plan.port";
import type { ProductionPlanResult } from "./ai/production-plan.port";
import { ProductionController } from "./production.controller";
import { ProductionPlanRepository } from "./repositories/production-plan.repository";

describe("ProductionController", () => {
  const proposalId = "proposal-1";
  const user: AuthenticatedUser = {
    sub: "user-1",
    tenantId: "tenant-1",
    organizationId: "org-1",
    role: "MEMBER",
    email: "bia@evefestas.com",
  };

  const diagnosticoCriativo = {
    perfilCasal: "Romântico contemporâneo",
    atmosferaDesejada: "Elegância leve e acolhedora",
    estiloPredominante: "Garden Fine Art",
    paletaSugerida: ["rosé"],
    mobiliarioSugerido: ["madeira clara"],
    iluminacaoSugerida: "Luz quente",
    materiaisRecomendados: ["Peônia"],
    compatibilidadeComEspaco: "Combina bem",
    justificativa: "Porque sim",
    promptVersion: "v1",
  };

  const fakeProposal = {
    id: proposalId,
    eventId: "event-1",
    eventStyleId: "style-1",
    conceptName: "Entre Montanhas e Flores",
    diagnosticoCriativo,
  } as Proposal;
  const fakeEvent = { id: "event-1", venueId: "venue-1", type: "WEDDING", guestsExpected: 100 } as Event;
  const fakeVenue = { id: "venue-1", name: "Villa Massari", recommendationNotes: [] } as unknown as Venue;

  const compatibleMaterial = {
    name: "Peônia",
    category: "FLOWER",
    neverRecommend: false,
    compatibleStyleIds: ["style-1"],
  } as Material;
  const incompatibleMaterial = {
    name: "Girassol",
    category: "FLOWER",
    neverRecommend: false,
    compatibleStyleIds: ["style-2"],
  } as Material;
  const neverRecommendMaterial = {
    name: "Neon",
    category: "LIGHTING",
    neverRecommend: true,
    compatibleStyleIds: ["style-1"],
  } as Material;

  const fakePlanResult: ProductionPlanResult = {
    materialsList: [{ name: "Peônia", category: "FLOWER", quantity: "40 buquês médios" }],
    setupSchedule: [
      { label: "Montagem", timing: "6h antes", durationEstimate: "3h", description: "Instalação da decoração." },
    ],
    checklist: [{ label: "Confirmar fornecedor de flores", category: "Fornecedores" }],
  };
  const fakePersistedPlan: ProductionPlan = {
    id: "plan-1",
    proposalId,
    createdAt: "2026-01-01T00:00:00.000Z",
    materialsList: [{ name: "Peônia", category: "FLOWER", quantity: "40 buquês médios", notes: null }],
    setupSchedule: fakePlanResult.setupSchedule,
    checklist: [{ label: "Confirmar fornecedor de flores", category: "Fornecedores", description: null }],
  };

  let controller: ProductionController;
  let proposals: jest.Mocked<ProposalRepository>;
  let events: jest.Mocked<EventRepository>;
  let venues: jest.Mocked<VenueRepository>;
  let materials: jest.Mocked<MaterialRepository>;
  let productionPlanAi: jest.Mocked<ProductionPlanPort>;
  let productionPlans: jest.Mocked<ProductionPlanRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductionController],
      providers: [
        { provide: ProposalRepository, useValue: { findById: jest.fn() } },
        { provide: EventRepository, useValue: { findById: jest.fn() } },
        { provide: VenueRepository, useValue: { findById: jest.fn() } },
        { provide: MaterialRepository, useValue: { findAll: jest.fn() } },
        { provide: ProductionPlanPort, useValue: { generate: jest.fn() } },
        { provide: ProductionPlanRepository, useValue: { upsert: jest.fn(), findByProposal: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(ProductionController);
    proposals = moduleRef.get(ProposalRepository);
    events = moduleRef.get(EventRepository);
    venues = moduleRef.get(VenueRepository);
    materials = moduleRef.get(MaterialRepository);
    productionPlanAi = moduleRef.get(ProductionPlanPort);
    productionPlans = moduleRef.get(ProductionPlanRepository);

    proposals.findById.mockResolvedValue(fakeProposal);
    events.findById.mockResolvedValue(fakeEvent);
    venues.findById.mockResolvedValue(fakeVenue);
  });

  describe("generateProductionPlan", () => {
    it("throws NotFoundException when the proposal does not exist", async () => {
      proposals.findById.mockResolvedValue(null);
      await expect(controller.generateProductionPlan(user, proposalId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("narrows the catalog materials to those compatible with the matched style", async () => {
      materials.findAll.mockResolvedValue([compatibleMaterial, incompatibleMaterial, neverRecommendMaterial]);
      productionPlanAi.generate.mockResolvedValue(fakePlanResult);
      productionPlans.upsert.mockResolvedValue(fakePersistedPlan);

      await controller.generateProductionPlan(user, proposalId);

      expect(productionPlanAi.generate).toHaveBeenCalledWith(
        expect.objectContaining({ catalogMaterials: [{ name: "Peônia", category: "FLOWER" }] }),
      );
    });

    it("falls back to the full usable catalog when nothing matches the style", async () => {
      materials.findAll.mockResolvedValue([incompatibleMaterial, neverRecommendMaterial]);
      productionPlanAi.generate.mockResolvedValue(fakePlanResult);
      productionPlans.upsert.mockResolvedValue(fakePersistedPlan);

      await controller.generateProductionPlan(user, proposalId);

      // Falls back to every non-neverRecommend material, ignoring the style match.
      expect(productionPlanAi.generate).toHaveBeenCalledWith(
        expect.objectContaining({ catalogMaterials: [{ name: "Girassol", category: "FLOWER" }] }),
      );
    });

    it("wraps a generation failure in a ServiceUnavailableException", async () => {
      materials.findAll.mockResolvedValue([compatibleMaterial]);
      productionPlanAi.generate.mockRejectedValue(new Error("simulated outage"));

      await expect(controller.generateProductionPlan(user, proposalId)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(productionPlans.upsert).not.toHaveBeenCalled();
    });
  });

  describe("getProductionPlan", () => {
    it("throws NotFoundException when the proposal does not exist", async () => {
      proposals.findById.mockResolvedValue(null);
      await expect(controller.getProductionPlan(user, proposalId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws BadRequestException when no plan has been generated yet", async () => {
      productionPlans.findByProposal.mockResolvedValue(null);
      await expect(controller.getProductionPlan(user, proposalId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("returns the persisted plan", async () => {
      productionPlans.findByProposal.mockResolvedValue(fakePersistedPlan);

      const result = await controller.getProductionPlan(user, proposalId);
      expect(result).toEqual(fakePersistedPlan);
    });
  });
});
