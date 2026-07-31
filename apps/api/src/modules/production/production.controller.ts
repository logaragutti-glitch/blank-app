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
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProposalRepository } from "../creative/repositories/proposal.repository";
import { MaterialRepository } from "../knowledge-graph/repositories/material.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { ProductionPlanPort } from "./ai/production-plan.port";
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
    private readonly productionPlanAi: ProductionPlanPort,
    private readonly productionPlans: ProductionPlanRepository,
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
}
