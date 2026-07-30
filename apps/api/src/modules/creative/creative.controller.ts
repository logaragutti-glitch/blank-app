import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { ClientRepository } from "../briefing/repositories/client.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { InspirationImageRepository } from "../briefing/repositories/inspiration-image.repository";
import { EventStyleRepository } from "../knowledge-graph/repositories/event-style.repository";
import { MaterialRepository } from "../knowledge-graph/repositories/material.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { DiagnosticoCriativoPort } from "./ai/diagnostico-criativo.port";
import { ProposalRepository } from "./repositories/proposal.repository";

// NOTE: tenantId/organizationId are query params for now — same temporary
// arrangement as the Briefing/Knowledge Graph controllers, until auth/
// tenant-resolution middleware exists.
@ApiTags("creative")
@ApiQuery({ name: "tenantId", required: true })
@ApiQuery({ name: "organizationId", required: true })
@Controller("creative")
export class CreativeController {
  constructor(
    private readonly clients: ClientRepository,
    private readonly events: EventRepository,
    private readonly images: InspirationImageRepository,
    private readonly venues: VenueRepository,
    private readonly eventStyles: EventStyleRepository,
    private readonly materials: MaterialRepository,
    private readonly proposals: ProposalRepository,
    private readonly diagnosticoCriativo: DiagnosticoCriativoPort,
  ) {}

  @Post(":eventId/diagnostico-criativo")
  async generateDiagnosticoCriativo(
    @Query("tenantId") tenantId: string,
    @Query("organizationId") organizationId: string,
    @Param("eventId") eventId: string,
  ) {
    const event = await this.events.findById(organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");

    const [client, venue, allImages, styles, materials] = await Promise.all([
      this.clients.findById(organizationId, event.clientId),
      this.venues.findById(organizationId, event.venueId),
      this.images.findByEvent(organizationId, eventId),
      this.eventStyles.findAll(organizationId),
      this.materials.findAll(organizationId),
    ]);

    if (!client) throw new NotFoundException("Client not found for this event");
    if (!venue) throw new NotFoundException("Venue not found for this event");
    if (styles.length === 0) {
      throw new BadRequestException(
        "No EventStyles found in the Knowledge Graph for this organization — seed it first.",
      );
    }

    const styleNameById = new Map(styles.map((style) => [style.id, style.name]));

    const diagnosticoCriativoInput = {
      client: {
        partnerOneName: client.partnerOneName,
        partnerTwoName: client.partnerTwoName,
        lifestyleTags: client.lifestyleTags,
        hobbies: client.hobbies,
        howTheyMet: client.howTheyMet,
        likesBeach: client.likesBeach,
        likesCountryside: client.likesCountryside,
        budgetAmount: client.budgetAmount,
        budgetCurrency: client.budgetCurrency,
        dietaryRestrictions: client.dietaryRestrictions,
      },
      event: {
        type: event.type,
        guestsExpected: event.guestsExpected,
        ceremonyDateTime: event.ceremonyDateTime,
        budgetAmount: event.budgetAmount,
      },
      venue: {
        name: venue.name,
        recommendationNotes: venue.recommendationNotes,
        typicalClimate: venue.typicalClimate,
        structuralConstraints: venue.structuralConstraints,
      },
      inspirationImages: allImages
        .filter((image) => image.status === "ANALYZED")
        .map((image) => ({ visionTags: image.visionTags, visionDescription: image.visionDescription })),
      candidateStyles: styles.map((style) => ({
        id: style.id,
        name: style.name,
        dimensionScores: style.dimensionScores,
        paletteColors: style.paletteColors,
        furnitureNotes: style.furnitureNotes,
        loungeNotes: style.loungeNotes,
      })),
      catalogMaterials: materials.map((material) => ({
        name: material.name,
        category: material.category,
        emotions: material.emotions,
        neverRecommend: material.neverRecommend,
        compatibleStyleNames: material.compatibleStyleIds
          .map((id) => styleNameById.get(id))
          .filter((name): name is string => Boolean(name)),
      })),
    };

    // Unlike inspiration-image uploads, a Proposal without a diagnosis isn't
    // a meaningful resource to persist as a stub — so on failure we surface
    // a clear error instead of writing a partial row (Proposal.diagnostico
    // is a required column).
    let result;
    try {
      result = await this.diagnosticoCriativo.generate(diagnosticoCriativoInput);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Agente 1 (Motor de Interpretacao) failed to generate the Diagnostico Criativo: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    return this.proposals.create({
      tenantId,
      organizationId,
      eventId,
      eventStyleId: result.matchedEventStyleId,
      diagnosticoCriativo: result.diagnosis,
    });
  }

  @Get(":eventId/proposals")
  async listProposals(
    @Query("organizationId") organizationId: string,
    @Param("eventId") eventId: string,
  ) {
    return this.proposals.findByEvent(organizationId, eventId);
  }
}
