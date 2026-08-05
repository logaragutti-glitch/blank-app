import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Material, Supplier, SupplierCategory } from "@eve-os/types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { ClientRepository } from "../briefing/repositories/client.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProposalRepository } from "../creative/repositories/proposal.repository";
import { MaterialRepository } from "../knowledge-graph/repositories/material.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";

export type EventCanvasNodeCategory =
  | "CLIENT"
  | "VENUE"
  | "FLOWERS"
  | "FURNITURE"
  | "LIGHTING"
  | "MUSIC"
  | "CATERING"
  | "EXPERIENCE";

// A read model assembled specifically for the Home screen and project
// navigation ("Novo Projeto" onwards) — no single existing repository
// exposes "all events for an organization, with the context a list/summary
// screen needs" (03-product-spec.md), so this composes across the
// Briefing/Knowledge Graph/Creative repositories instead of adding
// list-everything methods to each of them.
@ApiTags("projects")
@ApiBearerAuth()
@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly events: EventRepository,
    private readonly clients: ClientRepository,
    private readonly venues: VenueRepository,
    private readonly proposals: ProposalRepository,
    private readonly materials: MaterialRepository,
    private readonly suppliers: SupplierRepository,
  ) {}

  @Get()
  async listProjects(@CurrentUser() user: AuthenticatedUser) {
    const { organizationId } = user;
    const events = await this.events.findAll(organizationId);

    return Promise.all(
      events.map(async (event) => {
        const [client, venue, eventProposals] = await Promise.all([
          this.clients.findById(organizationId, event.clientId),
          this.venues.findById(organizationId, event.venueId),
          this.proposals.findByEvent(organizationId, event.id),
        ]);
        const latestProposal = eventProposals[0] ?? null;

        return {
          eventId: event.id,
          clientId: event.clientId,
          clientNames: client
            ? [client.partnerOneName, client.partnerTwoName].filter(Boolean).join(" & ")
            : "Cliente não encontrado",
          venueName: venue?.name ?? null,
          type: event.type,
          status: event.status,
          guestsExpected: event.guestsExpected,
          ceremonyDateTime: event.ceremonyDateTime,
          createdAt: event.createdAt,
          latestProposal: latestProposal
            ? {
                id: latestProposal.id,
                status: latestProposal.status,
                conceptName: latestProposal.conceptName,
                wowScore: latestProposal.wowScore,
              }
            : null,
        };
      }),
    );
  }

  // Canvas do Evento (Sprint 5+ item 8, 03-product-spec.md/06-ui-bible.md):
  // a real, read-only snapshot of everything already connected to this
  // Event in the Knowledge Graph — Cliente, Espaço, Flores, Mobiliário,
  // Luz, Música, Gastronomia, Experiência. Deliberately does NOT implement
  // the Rule Engine / Event Impact Engine's cascading recalculation
  // (04-ai-bible.md) — that requires real business rules (e.g. "ceremony
  // time change -> lighting recommendation") that don't exist anywhere in
  // this system yet, and fabricating them would violate the same golden
  // rule this whole codebase follows elsewhere (never invent data/
  // behavior without a real source). `hasData: false` on a node is an
  // honest signal that nothing is cadastrado yet, not a bug.
  @Get(":eventId/canvas")
  async getEventCanvas(@CurrentUser() user: AuthenticatedUser, @Param("eventId") eventId: string) {
    const { organizationId } = user;
    const event = await this.events.findById(organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");

    const [client, venue, eventProposals, allMaterials, allSuppliers] = await Promise.all([
      this.clients.findById(organizationId, event.clientId),
      this.venues.findById(organizationId, event.venueId),
      this.proposals.findByEvent(organizationId, eventId),
      this.materials.findAll(organizationId),
      this.suppliers.findAll(organizationId),
    ]);
    const diagnostico = eventProposals[0]?.diagnosticoCriativo ?? null;

    const usableMaterials = allMaterials.filter((material) => !material.neverRecommend);
    const flowers = this.narrowMaterials(usableMaterials, "FLOWER", diagnostico?.materiaisRecomendados ?? []);
    const furniture = this.narrowMaterials(usableMaterials, "FURNITURE", diagnostico?.mobiliarioSugerido ?? []);
    const lightingMaterials = usableMaterials.filter((material) => material.category === "LIGHTING");
    const lightingSuppliers = this.suppliersForCategory(allSuppliers, "LIGHTING", event.venueId);
    const musicSuppliers = this.suppliersForCategory(allSuppliers, "MUSIC", event.venueId);
    const cateringSuppliers = this.suppliersForCategory(allSuppliers, "CATERING", event.venueId);

    const nodes: {
      category: EventCanvasNodeCategory;
      summary: string | null;
      items: string[];
      hasData: boolean;
    }[] = [
      {
        category: "CLIENT",
        summary: client ? [client.partnerOneName, client.partnerTwoName].filter(Boolean).join(" & ") : null,
        items: client?.lifestyleTags ?? [],
        hasData: Boolean(client),
      },
      {
        category: "VENUE",
        summary: venue?.name ?? null,
        items: venue?.recommendationNotes ?? [],
        hasData: Boolean(venue),
      },
      {
        category: "FLOWERS",
        summary: diagnostico?.paletaSugerida.length ? `Paleta: ${diagnostico.paletaSugerida.join(", ")}` : null,
        items: flowers.map((material) => material.name),
        hasData: flowers.length > 0,
      },
      {
        category: "FURNITURE",
        summary: null,
        items: furniture.map((material) => material.name),
        hasData: furniture.length > 0,
      },
      {
        category: "LIGHTING",
        summary: diagnostico?.iluminacaoSugerida ?? null,
        items: [...lightingMaterials.map((material) => material.name), ...lightingSuppliers.map((s) => s.name)],
        hasData: Boolean(diagnostico?.iluminacaoSugerida) || lightingMaterials.length > 0 || lightingSuppliers.length > 0,
      },
      {
        category: "MUSIC",
        summary: null,
        items: musicSuppliers.map((supplier) => supplier.name),
        hasData: musicSuppliers.length > 0,
      },
      {
        category: "CATERING",
        summary: null,
        items: cateringSuppliers.map((supplier) => supplier.name),
        hasData: cateringSuppliers.length > 0,
      },
      {
        category: "EXPERIENCE",
        summary: diagnostico?.atmosferaDesejada ?? null,
        items: diagnostico ? [diagnostico.estiloPredominante] : [],
        hasData: Boolean(diagnostico?.atmosferaDesejada),
      },
    ];

    return {
      eventId,
      hasDiagnostico: diagnostico !== null,
      nodes,
    };
  }

  // Narrows a material category down to the ones the diagnosis actually
  // recommended (matched by name), falling back to the full usable
  // category when there's no diagnosis yet or nothing matched — same
  // "grounded in the real catalog, never invents" pattern used by the
  // production module.
  private narrowMaterials(materials: Material[], category: Material["category"], recommendedNames: string[]) {
    const inCategory = materials.filter((material) => material.category === category);
    if (recommendedNames.length === 0) return inCategory;

    const recommendedSet = new Set(recommendedNames.map((name) => name.toLowerCase()));
    const matched = inCategory.filter((material) => recommendedSet.has(material.name.toLowerCase()));
    return matched.length > 0 ? matched : inCategory;
  }

  private suppliersForCategory(suppliers: Supplier[], category: SupplierCategory, venueId: string): Supplier[] {
    const inCategory = suppliers.filter((supplier) => supplier.category === category);
    const preferred = inCategory.filter((supplier) => supplier.preferredVenueIds.includes(venueId));
    return preferred.length > 0 ? preferred : inCategory;
  }
}
