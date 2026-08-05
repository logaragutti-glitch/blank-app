import { BadRequestException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { BudgetAnalysis, Client, Event, Material, ProductionPlan, Proposal, Supplier, Venue } from "@eve-os/types";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { ClientRepository } from "../briefing/repositories/client.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProposalRepository } from "../creative/repositories/proposal.repository";
import { MaterialRepository } from "../knowledge-graph/repositories/material.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { BudgetAnalysisPort } from "./ai/budget-analysis.port";
import type { BudgetAnalysisResult } from "./ai/budget-analysis.port";
import { ProductionPlanPort } from "./ai/production-plan.port";
import type { ProductionPlanResult } from "./ai/production-plan.port";
import { ProductionController } from "./production.controller";
import { BudgetAnalysisRepository } from "./repositories/budget-analysis.repository";
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
    status: "APPROVED",
    investmentAmount: 30000,
  } as Proposal;
  const fakeEvent = {
    id: "event-1",
    venueId: "venue-1",
    type: "WEDDING",
    guestsExpected: 100,
    budgetAmount: 10000,
  } as Event;
  const fakeVenue = { id: "venue-1", name: "Villa Massari", recommendationNotes: [] } as unknown as Venue;

  const compatibleMaterial = {
    name: "Peônia",
    category: "FLOWER",
    neverRecommend: false,
    compatibleStyleIds: ["style-1"],
    estimatedUnitCost: null,
  } as Material;
  const incompatibleMaterial = {
    name: "Girassol",
    category: "FLOWER",
    neverRecommend: false,
    compatibleStyleIds: ["style-2"],
    estimatedUnitCost: null,
  } as Material;
  const neverRecommendMaterial = {
    name: "Neon",
    category: "LIGHTING",
    neverRecommend: true,
    compatibleStyleIds: ["style-1"],
    estimatedUnitCost: null,
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

  const costedMaterial = { ...compatibleMaterial, estimatedUnitCost: 45 } as Material;
  const costedSupplier = {
    id: "supplier-1",
    name: "Flores da Serra",
    category: "FLORIST",
    preferredVenueIds: ["venue-1"],
    estimatedCost: 3800,
  } as Supplier;
  const fakeAnalysis: BudgetAnalysis = {
    id: "analysis-1",
    proposalId,
    createdAt: "2026-01-01T00:00:00.000Z",
    lineItems: [{ materialName: "Peônia", category: "FLOWER", estimatedQuantity: 40, unitCost: 45, lineTotal: 1800 }],
    bestValueSuppliers: [
      { category: "FLORIST", supplierId: "supplier-1", supplierName: "Flores da Serra", estimatedCost: 3800 },
    ],
    materialsCost: 1800,
    suppliersCost: 3800,
    totalEstimatedCost: 5600,
    margin: 24400,
    fitsBudget: false,
    hasIncompleteData: false,
  };

  let controller: ProductionController;
  let proposals: jest.Mocked<ProposalRepository>;
  let events: jest.Mocked<EventRepository>;
  let clients: jest.Mocked<ClientRepository>;
  let venues: jest.Mocked<VenueRepository>;
  let materials: jest.Mocked<MaterialRepository>;
  let suppliers: jest.Mocked<SupplierRepository>;
  let productionPlanAi: jest.Mocked<ProductionPlanPort>;
  let productionPlans: jest.Mocked<ProductionPlanRepository>;
  let budgetAnalysisAi: jest.Mocked<BudgetAnalysisPort>;
  let budgetAnalyses: jest.Mocked<BudgetAnalysisRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductionController],
      providers: [
        { provide: ProposalRepository, useValue: { findById: jest.fn(), findByEvent: jest.fn() } },
        { provide: EventRepository, useValue: { findById: jest.fn(), findAll: jest.fn() } },
        { provide: ClientRepository, useValue: { findById: jest.fn() } },
        { provide: VenueRepository, useValue: { findById: jest.fn() } },
        { provide: MaterialRepository, useValue: { findAll: jest.fn() } },
        { provide: SupplierRepository, useValue: { findAll: jest.fn() } },
        { provide: ProductionPlanPort, useValue: { generate: jest.fn() } },
        { provide: ProductionPlanRepository, useValue: { upsert: jest.fn(), findByProposal: jest.fn() } },
        { provide: BudgetAnalysisPort, useValue: { generate: jest.fn() } },
        { provide: BudgetAnalysisRepository, useValue: { upsert: jest.fn(), findByProposal: jest.fn() } },
      ],
    }).compile();

    controller = moduleRef.get(ProductionController);
    proposals = moduleRef.get(ProposalRepository);
    events = moduleRef.get(EventRepository);
    clients = moduleRef.get(ClientRepository);
    venues = moduleRef.get(VenueRepository);
    materials = moduleRef.get(MaterialRepository);
    suppliers = moduleRef.get(SupplierRepository);
    productionPlanAi = moduleRef.get(ProductionPlanPort);
    productionPlans = moduleRef.get(ProductionPlanRepository);
    budgetAnalysisAi = moduleRef.get(BudgetAnalysisPort);
    budgetAnalyses = moduleRef.get(BudgetAnalysisRepository);

    proposals.findById.mockResolvedValue(fakeProposal);
    events.findById.mockResolvedValue(fakeEvent);
    venues.findById.mockResolvedValue(fakeVenue);
  });

  describe("generateProductionPlan", () => {
    it("throws NotFoundException when the proposal does not exist", async () => {
      proposals.findById.mockResolvedValue(null);
      await expect(controller.generateProductionPlan(user, proposalId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws BadRequestException when the proposal has not been approved yet", async () => {
      proposals.findById.mockResolvedValue({ ...fakeProposal, status: "DRAFT" } as Proposal);
      await expect(controller.generateProductionPlan(user, proposalId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(materials.findAll).not.toHaveBeenCalled();
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

  describe("generateBudgetAnalysis", () => {
    const aiResult: BudgetAnalysisResult = { materialEstimates: [{ materialName: "Peônia", estimatedQuantity: 40 }] };

    it("throws NotFoundException when the proposal does not exist", async () => {
      proposals.findById.mockResolvedValue(null);
      await expect(controller.generateBudgetAnalysis(user, proposalId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws BadRequestException when the proposal has not been approved yet", async () => {
      proposals.findById.mockResolvedValue({ ...fakeProposal, status: "DRAFT" } as Proposal);
      await expect(controller.generateBudgetAnalysis(user, proposalId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(materials.findAll).not.toHaveBeenCalled();
    });

    it("only offers materials with a known cost to Agente 4", async () => {
      materials.findAll.mockResolvedValue([costedMaterial, incompatibleMaterial, neverRecommendMaterial]);
      suppliers.findAll.mockResolvedValue([costedSupplier]);
      budgetAnalysisAi.generate.mockResolvedValue(aiResult);
      budgetAnalyses.upsert.mockResolvedValue(fakeAnalysis);

      await controller.generateBudgetAnalysis(user, proposalId);

      expect(budgetAnalysisAi.generate).toHaveBeenCalledWith(
        expect.objectContaining({ catalogMaterials: [{ name: "Peônia", category: "FLOWER" }] }),
      );
    });

    it("computes cost math deterministically: line totals, margin, and budget fit", async () => {
      materials.findAll.mockResolvedValue([costedMaterial]);
      suppliers.findAll.mockResolvedValue([costedSupplier]);
      budgetAnalysisAi.generate.mockResolvedValue(aiResult);
      budgetAnalyses.upsert.mockResolvedValue(fakeAnalysis);

      await controller.generateBudgetAnalysis(user, proposalId);

      expect(budgetAnalyses.upsert).toHaveBeenCalledWith(proposalId, {
        lineItems: [{ materialName: "Peônia", category: "FLOWER", estimatedQuantity: 40, unitCost: 45, lineTotal: 1800 }],
        bestValueSuppliers: [
          { category: "FLORIST", supplierId: "supplier-1", supplierName: "Flores da Serra", estimatedCost: 3800 },
        ],
        materialsCost: 1800,
        suppliersCost: 3800,
        totalEstimatedCost: 5600,
        // investmentAmount (30000) - totalEstimatedCost (5600)
        margin: 24400,
        // totalEstimatedCost (5600) > event.budgetAmount (10000) is false, so it fits
        fitsBudget: true,
        hasIncompleteData: false,
      });
    });

    it("flags incomplete data when no costed material or supplier is found", async () => {
      materials.findAll.mockResolvedValue([incompatibleMaterial]);
      suppliers.findAll.mockResolvedValue([]);
      budgetAnalysisAi.generate.mockResolvedValue({ materialEstimates: [] });
      budgetAnalyses.upsert.mockResolvedValue(fakeAnalysis);

      await controller.generateBudgetAnalysis(user, proposalId);

      expect(budgetAnalyses.upsert).toHaveBeenCalledWith(
        proposalId,
        expect.objectContaining({ hasIncompleteData: true, materialsCost: 0, suppliersCost: 0 }),
      );
    });

    it("wraps a generation failure in a ServiceUnavailableException", async () => {
      materials.findAll.mockResolvedValue([costedMaterial]);
      suppliers.findAll.mockResolvedValue([costedSupplier]);
      budgetAnalysisAi.generate.mockRejectedValue(new Error("simulated outage"));

      await expect(controller.generateBudgetAnalysis(user, proposalId)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(budgetAnalyses.upsert).not.toHaveBeenCalled();
    });
  });

  describe("getBudgetAnalysis", () => {
    it("throws NotFoundException when the proposal does not exist", async () => {
      proposals.findById.mockResolvedValue(null);
      await expect(controller.getBudgetAnalysis(user, proposalId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws BadRequestException when no analysis has been generated yet", async () => {
      budgetAnalyses.findByProposal.mockResolvedValue(null);
      await expect(controller.getBudgetAnalysis(user, proposalId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("returns the persisted analysis", async () => {
      budgetAnalyses.findByProposal.mockResolvedValue(fakeAnalysis);
      const result = await controller.getBudgetAnalysis(user, proposalId);
      expect(result).toEqual(fakeAnalysis);
    });
  });

  describe("getFinancialSummary", () => {
    const eventWithBudget = { id: "event-1", clientId: "client-1", budgetAmount: 10000 } as Event;
    const eventWithoutBudget = { id: "event-2", clientId: "client-2", budgetAmount: null } as Event;

    it("aggregates budgetAmount and totalEstimatedCost across every event, skipping proposals/analyses that don't exist yet", async () => {
      events.findAll.mockResolvedValue([eventWithBudget, eventWithoutBudget]);
      clients.findById.mockImplementation(
        async (_org, id) => ({ partnerOneName: id, partnerTwoName: null }) as Client,
      );
      proposals.findByEvent.mockImplementation(async (_org, eventId) =>
        eventId === "event-1" ? [{ id: "proposal-1" } as Proposal] : [],
      );
      budgetAnalyses.findByProposal.mockResolvedValue({ totalEstimatedCost: 6000, fitsBudget: true } as BudgetAnalysis);

      const result = await controller.getFinancialSummary(user);

      expect(result.totalEvents).toBe(2);
      expect(result.eventsWithBudget).toBe(1);
      expect(result.totalBudgetAmount).toBe(10000);
      expect(result.eventsWithBudgetAnalysis).toBe(1);
      expect(result.totalEstimatedCost).toBe(6000);
      expect(result.fitsBudgetCount).toBe(1);
      expect(result.overBudgetCount).toBe(0);
      expect(result.projects).toHaveLength(2);
      expect(result.projects[1]).toMatchObject({
        eventId: "event-2",
        budgetAmount: null,
        totalEstimatedCost: null,
        fitsBudget: null,
      });
    });

    it("returns all zeros instead of throwing when the org has no events yet", async () => {
      events.findAll.mockResolvedValue([]);
      const result = await controller.getFinancialSummary(user);
      expect(result).toMatchObject({
        totalEvents: 0,
        totalBudgetAmount: 0,
        totalEstimatedCost: 0,
        projects: [],
      });
    });
  });
});
