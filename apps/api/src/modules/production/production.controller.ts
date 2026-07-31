import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Material, Supplier, SupplierCategory } from "@eve-os/types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProposalRepository } from "../creative/repositories/proposal.repository";
import { MaterialRepository } from "../knowledge-graph/repositories/material.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { BudgetAnalysisPort } from "./ai/budget-analysis.port";
import { ProductionPlanPort } from "./ai/production-plan.port";
import { BudgetAnalysisRepository } from "./repositories/budget-analysis.repository";
import { ProductionPlanRepository } from "./repositories/production-plan.repository";

@ApiTags("production")
@ApiBearerAuth()
@Controller("production")
export class ProductionController {
  constructor(
    private readonly proposals: ProposalRepository,
    private readonly events: EventRepository,
    private readonly venues: VenueRepository,
    private readonly materials: MaterialRepository,
    private readonly suppliers: SupplierRepository,
    private readonly productionPlanAi: ProductionPlanPort,
    private readonly productionPlans: ProductionPlanRepository,
    private readonly budgetAnalysisAi: BudgetAnalysisPort,
    private readonly budgetAnalyses: BudgetAnalysisRepository,
  ) {}

  // Agente 4 / Diretor de Producao (04-ai-bible.md): turns an already-
  // diagnosed Proposal into the materials list, day-of assembly schedule,
  // and operational checklist. Re-running this replaces the previous
  // production plan wholesale (see ProductionPlanRepository.upsert), so
  // it's safe to call again after the proposal's components change.
  @Post("proposals/:proposalId/plan")
  async generateProductionPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ) {
    const { organizationId } = user;
    const proposal = await this.proposals.findById(organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    this.assertApproved(proposal.status);

    const event = await this.events.findById(organizationId, proposal.eventId);
    if (!event) throw new NotFoundException("Event not found for this proposal");
    const venue = await this.venues.findById(organizationId, event.venueId);
    if (!venue) throw new NotFoundException("Venue not found for this event");

    const catalogMaterials = await this.selectCatalogMaterials(organizationId, proposal.eventStyleId);

    let result;
    try {
      result = await this.productionPlanAi.generate({
        conceptName: proposal.conceptName ?? "",
        event: {
          type: event.type,
          guestsExpected: event.guestsExpected,
          ceremonyDateTime: event.ceremonyDateTime,
        },
        venue: {
          name: venue.name,
          recommendationNotes: venue.recommendationNotes,
          structuralConstraints: venue.structuralConstraints,
        },
        diagnostico: proposal.diagnosticoCriativo,
        catalogMaterials,
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Agente 4 (Diretor de Producao) failed to generate the production plan: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    return this.productionPlans.upsert(proposalId, result);
  }

  @Get("proposals/:proposalId/plan")
  async getProductionPlan(@CurrentUser() user: AuthenticatedUser, @Param("proposalId") proposalId: string) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");

    const plan = await this.productionPlans.findByProposal(proposalId);
    if (!plan) {
      throw new BadRequestException(
        "This Proposal has no production plan yet — call POST /production/proposals/:proposalId/plan first.",
      );
    }
    return plan;
  }

  // Agente 4's budget analysis: cabe no orçamento? qual margem? qual
  // fornecedor tem melhor custo-benefício? Only Agente 4 estimates a
  // realistic quantity per material (given the guest count/concept) — the
  // cost math itself (unit cost × quantity, cheapest supplier per category,
  // margin, budget fit) is computed deterministically below from real
  // Knowledge Graph data (Material.estimatedUnitCost, Supplier.
  // estimatedCost), never invented by the model.
  @Post("proposals/:proposalId/budget-analysis")
  async generateBudgetAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ) {
    const { organizationId } = user;
    const proposal = await this.proposals.findById(organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    this.assertApproved(proposal.status);

    const event = await this.events.findById(organizationId, proposal.eventId);
    if (!event) throw new NotFoundException("Event not found for this proposal");

    const costedMaterials = await this.selectCostedMaterials(organizationId, proposal.eventStyleId);
    const bestValueSuppliers = await this.selectBestValueSuppliers(organizationId, event.venueId);

    let result;
    try {
      result = await this.budgetAnalysisAi.generate({
        conceptName: proposal.conceptName ?? "",
        event: { type: event.type, guestsExpected: event.guestsExpected },
        diagnostico: proposal.diagnosticoCriativo,
        catalogMaterials: costedMaterials.map((material) => ({ name: material.name, category: material.category })),
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Agente 4 (Diretor de Producao) failed to generate the budget analysis: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    const materialByName = new Map(costedMaterials.map((material) => [material.name, material]));
    const lineItems = result.materialEstimates
      .map((estimate) => {
        const material = materialByName.get(estimate.materialName);
        // The tool schema's enum already constrains this to a known,
        // costed material — an unmatched name means the model didn't
        // honor the schema, so skip it rather than fabricate a line item.
        if (!material || material.estimatedUnitCost === null) return null;
        return {
          materialName: material.name,
          category: material.category,
          estimatedQuantity: estimate.estimatedQuantity,
          unitCost: material.estimatedUnitCost,
          lineTotal: material.estimatedUnitCost * estimate.estimatedQuantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const materialsCost = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const suppliersCost = bestValueSuppliers.reduce((sum, supplier) => sum + supplier.estimatedCost, 0);
    const totalEstimatedCost = materialsCost + suppliersCost;
    const margin = proposal.investmentAmount !== null ? proposal.investmentAmount - totalEstimatedCost : null;
    const fitsBudget = event.budgetAmount !== null ? totalEstimatedCost <= event.budgetAmount : null;
    const hasIncompleteData = costedMaterials.length === 0 || bestValueSuppliers.length === 0;

    return this.budgetAnalyses.upsert(proposalId, {
      lineItems,
      bestValueSuppliers,
      materialsCost,
      suppliersCost,
      totalEstimatedCost,
      margin,
      fitsBudget,
      hasIncompleteData,
    });
  }

  @Get("proposals/:proposalId/budget-analysis")
  async getBudgetAnalysis(@CurrentUser() user: AuthenticatedUser, @Param("proposalId") proposalId: string) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");

    const analysis = await this.budgetAnalyses.findByProposal(proposalId);
    if (!analysis) {
      throw new BadRequestException(
        "This Proposal has no budget analysis yet — call POST /production/proposals/:proposalId/budget-analysis first.",
      );
    }
    return analysis;
  }

  private assertApproved(status: string) {
    if (status !== "APPROVED") {
      throw new BadRequestException(
        "This Proposal must be approved before generating production artifacts — call POST /creative/proposals/:proposalId/approve first.",
      );
    }
  }

  // Grounds the materials list in the real catalog (never invents materials
  // outside it, never suggests items marked "never recommend" — same golden
  // rules as Agente 1/3). Narrows to materials compatible with the matched
  // EventStyle when one exists, falling back to the full usable catalog
  // otherwise — a quality improvement, never a hard requirement.
  private async selectCatalogMaterials(organizationId: string, eventStyleId: string | null) {
    const allMaterials = await this.materials.findAll(organizationId);
    const usableMaterials = allMaterials.filter((material) => !material.neverRecommend);
    const compatibleMaterials = eventStyleId
      ? usableMaterials.filter((material) => material.compatibleStyleIds.includes(eventStyleId))
      : [];

    return (compatibleMaterials.length > 0 ? compatibleMaterials : usableMaterials).map((material) => ({
      name: material.name,
      category: material.category,
    }));
  }

  // Same narrowing as selectCatalogMaterials, further restricted to
  // materials with a real, known cost — only these are ever useful for a
  // budget calculation, and only these are ever offered to Agente 4.
  private async selectCostedMaterials(organizationId: string, eventStyleId: string | null): Promise<Material[]> {
    const allMaterials = await this.materials.findAll(organizationId);
    const costedMaterials = allMaterials.filter(
      (material) => !material.neverRecommend && material.estimatedUnitCost !== null,
    );
    const compatibleCostedMaterials = eventStyleId
      ? costedMaterials.filter((material) => material.compatibleStyleIds.includes(eventStyleId))
      : [];

    return compatibleCostedMaterials.length > 0 ? compatibleCostedMaterials : costedMaterials;
  }

  // Deterministic: the cheapest known-cost supplier per category, preferring
  // suppliers already marked preferred at this venue, falling back to any
  // costed supplier in the organization otherwise.
  private async selectBestValueSuppliers(organizationId: string, venueId: string) {
    const allSuppliers = await this.suppliers.findAll(organizationId);
    const costedSuppliers = allSuppliers.filter((supplier) => supplier.estimatedCost !== null);
    const preferredSuppliers = costedSuppliers.filter((supplier) => supplier.preferredVenueIds.includes(venueId));
    const candidates = preferredSuppliers.length > 0 ? preferredSuppliers : costedSuppliers;

    const cheapestByCategory = new Map<SupplierCategory, Supplier>();
    for (const supplier of candidates) {
      const current = cheapestByCategory.get(supplier.category);
      if (!current || (supplier.estimatedCost as number) < (current.estimatedCost as number)) {
        cheapestByCategory.set(supplier.category, supplier);
      }
    }

    return Array.from(cheapestByCategory.values()).map((supplier) => ({
      category: supplier.category,
      supplierId: supplier.id,
      supplierName: supplier.name,
      estimatedCost: supplier.estimatedCost as number,
    }));
  }
}
