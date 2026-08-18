import { randomUUID } from "node:crypto";
import { CommercialQuoteStatus as PrismaCommercialQuoteStatus, Prisma } from "@prisma/client";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  ServiceUnavailableException,
  StreamableFile,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type {
  ComponentType,
  EventStyle,
  InspirationImage,
  ProposalComponent,
  CommercialProposal,
  CommercialProposalStatus,
  CommercialProposalVersion,
  CommercialQuote,
} from "@eve-os/types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import { StoragePort } from "../../infrastructure/storage/storage.port";
import { ClientRepository } from "../briefing/repositories/client.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { InspirationImageRepository } from "../briefing/repositories/inspiration-image.repository";
import { EventStyleRepository } from "../knowledge-graph/repositories/event-style.repository";
import { MaterialRepository } from "../knowledge-graph/repositories/material.repository";
import { SupplierRepository } from "../knowledge-graph/repositories/supplier.repository";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { ProjectSupplierRepository } from "../project-suppliers/repositories/project-supplier.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { ConceptualRenderPort } from "./ai/conceptual-render.port";
import { DiagnosticoCriativoPort } from "./ai/diagnostico-criativo.port";
import {
  ProposalComponentsPort,
  type NarrativeBlock,
  type ProposalNarrativeKey,
} from "./ai/proposal-components.port";
import { UpdateProposalComponentDto } from "./dto/update-proposal-component.dto";
import { buildProposalComponents } from "./proposal-component-builder";
import {
  buildCommercialProposalRecord,
  commercialSupplierCategoryFor,
  isCommercialCategoryAllowed,
} from "./commercial-proposal-builder";
import { buildCommercialProposalPdf } from "./commercial-proposal-pdf-builder";
import {
  CreateCommercialQuoteDto,
  UpdateCommercialQuoteStatusDto,
  UpsertCommercialProposalDto,
} from "./dto/upsert-commercial-proposal.dto";
import { UpdateCommercialStatusDto } from "./dto/update-commercial-status.dto";
import { buildProposalPdf, type ProposalPdfComponent } from "./proposal-pdf-builder";
import {
  RENDERABLE_COMPONENT_TYPES,
  type RenderableComponentType,
  isRenderableComponentType,
} from "./renderable-component-types";
import { ProposalComponentRepository } from "./repositories/proposal-component.repository";
import { CommercialProposalRepository } from "./repositories/commercial-proposal.repository";
import { ProposalRepository } from "./repositories/proposal.repository";
import { computeWowScore } from "./wow-score";

const SEMANTIC_SEARCH_STYLE_LIMIT = 5;
const REGIONAL_SERVICE_AREA_TOKENS = [
  "regiao dos lagos",
  "cabo frio",
  "buzios",
  "armacao dos buzios",
  "arraial do cabo",
  "araruama",
  "sao pedro da aldeia",
  "saquarema",
  "iguaba grande",
];

function isRegionalServiceArea(area: string): boolean {
  const normalized = area.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return REGIONAL_SERVICE_AREA_TOKENS.some((token) => normalized.includes(token));
}

const NARRATIVE_KEY_BY_COMPONENT_TYPE: Partial<Record<ComponentType, ProposalNarrativeKey>> = {
  CONCEPT: "concept",
  COUPLE_STORY: "coupleStory",
  ENTRANCE: "entrance",
  CEREMONY: "ceremony",
  CAKE_TABLE: "cakeTable",
  LOUNGE: "lounge",
  GUEST_TABLES: "guestTables",
  BAR: "bar",
  BUFFET: "buffet",
  DANCE_FLOOR: "danceFloor",
  LIGHTING: "lighting",
  FLORALS: "florals",
};

@ApiTags("creative")
@ApiBearerAuth()
@Controller("creative")
export class CreativeController {
  private readonly logger = new Logger(CreativeController.name);

  constructor(
    private readonly clients: ClientRepository,
    private readonly events: EventRepository,
    private readonly images: InspirationImageRepository,
    private readonly venues: VenueRepository,
    private readonly eventStyles: EventStyleRepository,
    private readonly materials: MaterialRepository,
    private readonly suppliers: SupplierRepository,
    private readonly projectSuppliers: ProjectSupplierRepository,
    private readonly prisma: PrismaService,
    private readonly proposals: ProposalRepository,
    private readonly commercialProposals: CommercialProposalRepository,
    private readonly proposalComponents: ProposalComponentRepository,
    private readonly diagnosticoCriativo: DiagnosticoCriativoPort,
    private readonly proposalComponentsAi: ProposalComponentsPort,
    private readonly embeddings: EmbeddingPort,
    private readonly conceptualRender: ConceptualRenderPort,
    private readonly storage: StoragePort,
  ) {}

  @Post(":eventId/diagnostico-criativo")
  async generateDiagnosticoCriativo(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
  ) {
    const { organizationId } = user;
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
    const candidateStyles = await this.selectCandidateStyles(organizationId, allImages, styles);

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
        .map((image) => ({
          visionTags: image.visionTags,
          visionDescription: image.visionDescription,
        })),
      candidateStyles: candidateStyles.map((style) => ({
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

    const matchedStyleDimensionScores =
      candidateStyles.find((style) => style.id === result.matchedEventStyleId)?.dimensionScores ??
      null;

    return this.proposals.create({
      tenantId: user.tenantId,
      organizationId,
      eventId,
      eventStyleId: result.matchedEventStyleId,
      diagnosticoCriativo: result.diagnosis,
      wowScore: computeWowScore(event.dnaScores, matchedStyleDimensionScores),
    });
  }

  @Get(":eventId/proposals")
  async listProposals(@CurrentUser() user: AuthenticatedUser, @Param("eventId") eventId: string) {
    return this.proposals.findByEvent(user.organizationId, eventId);
  }

  // Formal approval gate: production artifacts (see the production module)
  // are meant to be generated only once the client has actually said yes to
  // this proposal, not merely because a diagnosis/components exist.
  @Post("proposals/:proposalId/approve")
  async approveProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    return this.proposals.updateStatus(proposalId, "APPROVED");
  }

  @Post("proposals/:proposalId/reject")
  async rejectProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    return this.proposals.updateStatus(proposalId, "REJECTED");
  }

  // Agente 3 / Creative Engine: generates the 18 reusable proposal
  // components (Capitulo 7) from the Diagnostico Criativo already stored on
  // the Proposal. Re-running this replaces the previous version of each
  // component (see ProposalComponentRepository.upsertMany), so it is safe
  // to call again after the diagnosis or briefing data changes.
  @Post("proposals/:proposalId/components")
  async generateProposalComponents(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ) {
    const { organizationId } = user;
    const proposal = await this.proposals.findById(organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");

    const event = await this.events.findById(organizationId, proposal.eventId);
    if (!event) throw new NotFoundException("Event not found for this proposal");

    const [client, venue] = await Promise.all([
      this.clients.findById(organizationId, event.clientId),
      this.venues.findById(organizationId, event.venueId),
    ]);
    if (!client) throw new NotFoundException("Client not found for this event");
    if (!venue) throw new NotFoundException("Venue not found for this event");

    let narrative;
    try {
      narrative = await this.proposalComponentsAi.generate({
        client: {
          partnerOneName: client.partnerOneName,
          partnerTwoName: client.partnerTwoName,
          howTheyMet: client.howTheyMet,
          proposalStory: client.proposalStory,
        },
        event: { type: event.type, guestsExpected: event.guestsExpected },
        venue: {
          name: venue.name,
          recommendationNotes: venue.recommendationNotes,
          structuralConstraints: venue.structuralConstraints,
        },
        diagnostico: proposal.diagnosticoCriativo,
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Agente 3 (Creative Engine) failed to generate the proposal components: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    const components = buildProposalComponents({
      client,
      event,
      venue,
      diagnostico: proposal.diagnosticoCriativo,
      narrative,
    });

    const [saved] = await Promise.all([
      this.proposalComponents.upsertMany(proposalId, components),
      this.proposals.updateConceptName(proposalId, narrative.concept.title),
    ]);
    return saved;
  }

  @Post("proposals/:proposalId/components/:componentType/regenerate")
  async regenerateProposalComponent(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
    @Param("componentType") componentTypeParam: string,
  ) {
    const componentType = componentTypeParam as ComponentType;
    const narrativeKey = NARRATIVE_KEY_BY_COMPONENT_TYPE[componentType];
    if (!narrativeKey) {
      throw new BadRequestException(
        "componentType must be one of: CONCEPT, COUPLE_STORY, ENTRANCE, CEREMONY, CAKE_TABLE, LOUNGE, GUEST_TABLES, BAR, BUFFET, DANCE_FLOOR, LIGHTING, FLORALS",
      );
    }

    const { organizationId } = user;
    const proposal = await this.proposals.findById(organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    const event = await this.events.findById(organizationId, proposal.eventId);
    if (!event) throw new NotFoundException("Event not found for this proposal");

    const [client, venue] = await Promise.all([
      this.clients.findById(organizationId, event.clientId),
      this.venues.findById(organizationId, event.venueId),
    ]);
    if (!client) throw new NotFoundException("Client not found for this event");
    if (!venue) throw new NotFoundException("Venue not found for this event");

    const components = await this.proposalComponents.findByProposal(proposalId);
    const target = components.find((component) => component.type === componentType);
    if (!target)
      throw new NotFoundException("Generate the proposal components before regenerating one.");

    const current: NarrativeBlock = {
      title: String(target.content.title ?? target.content.name ?? ""),
      description: String(target.content.description ?? target.content.text ?? ""),
    };

    let regenerated: NarrativeBlock;
    try {
      regenerated = await this.proposalComponentsAi.regenerate(
        {
          client: {
            partnerOneName: client.partnerOneName,
            partnerTwoName: client.partnerTwoName,
            howTheyMet: client.howTheyMet,
            proposalStory: client.proposalStory,
          },
          event: { type: event.type, guestsExpected: event.guestsExpected },
          venue: {
            name: venue.name,
            recommendationNotes: venue.recommendationNotes,
            structuralConstraints: venue.structuralConstraints,
          },
          diagnostico: proposal.diagnosticoCriativo,
        },
        narrativeKey,
        current,
      );
    } catch (error) {
      throw new ServiceUnavailableException(
        `Não foi possível regenerar este componente: ${error instanceof Error ? error.message : "erro desconhecido"}`,
      );
    }

    const contentPatch =
      componentType === "CONCEPT"
        ? { name: regenerated.title, description: regenerated.description }
        : componentType === "COUPLE_STORY"
          ? { title: regenerated.title, text: regenerated.description }
          : { title: regenerated.title, description: regenerated.description };
    const [updated] = await this.proposalComponents.upsertMany(proposalId, [
      { type: target.type, order: target.order, content: { ...target.content, ...contentPatch } },
    ]);
    if (!updated) throw new Error("Failed to persist the regenerated component.");

    if (componentType === "CONCEPT")
      await this.proposals.updateConceptName(proposalId, regenerated.title);
    const [withRenderUrl] = await this.attachRenderUrls([updated]);
    return withRenderUrl;
  }

  @Get("proposals/:proposalId/components")
  async listProposalComponents(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    const components = await this.proposalComponents.findByProposal(proposalId);
    return this.attachRenderUrls(components);
  }

  // Manual field-by-field editing (Sprint 5+ item 6): lets a human refine a
  // single already-generated component without discarding the others or
  // waiting for a full AI regeneration (see generateProposalComponents).
  // Shallow-merges the given fields into the component's existing content,
  // so a partial edit (e.g. just `title`) never wipes out sibling fields
  // (e.g. a conceptual render's `renderStorageKey`).
  @Patch("proposals/:proposalId/components/:componentType")
  async updateProposalComponent(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
    @Param("componentType") componentTypeParam: string,
    @Body() dto: UpdateProposalComponentDto,
  ) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");

    const components = await this.proposalComponents.findByProposal(proposalId);
    const target = components.find((component) => component.type === componentTypeParam);
    if (!target) {
      throw new NotFoundException(
        `No "${componentTypeParam}" component found for this Proposal — generate the components first.`,
      );
    }

    const [updated] = await this.proposalComponents.upsertMany(proposalId, [
      { type: target.type, order: target.order, content: { ...target.content, ...dto.content } },
    ]);
    if (!updated) throw new Error("Failed to persist the manual edit.");

    const [withRenderUrl] = await this.attachRenderUrls([updated]);
    return withRenderUrl;
  }

  // Renders automaticos (04-ai-bible.md): a conceptual hero image for the
  // Capa (the event as a whole) or for one of the 10 narrative environments
  // (Entrada, Cerimonia, Mesa do bolo...), generated from the concept/
  // diagnosis rather than only relying on the client's own inspiration
  // photos. Stored under that component's content as `renderStorageKey` — a
  // fresh signed URL is computed on every read (see attachRenderUrls)
  // instead of persisting a URL that would eventually expire.
  @Post("proposals/:proposalId/render/:componentType")
  async generateConceptualRender(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
    @Param("componentType") componentTypeParam: string,
  ) {
    if (!isRenderableComponentType(componentTypeParam)) {
      throw new BadRequestException(
        `componentType must be one of: ${RENDERABLE_COMPONENT_TYPES.join(", ")}`,
      );
    }
    const componentType: RenderableComponentType = componentTypeParam;

    const { organizationId } = user;
    const proposal = await this.proposals.findById(organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");

    const event = await this.events.findById(organizationId, proposal.eventId);
    if (!event) throw new NotFoundException("Event not found for this proposal");
    const venue = await this.venues.findById(organizationId, event.venueId);
    if (!venue) throw new NotFoundException("Venue not found for this event");

    const components = await this.proposalComponents.findByProposal(proposalId);
    const target = components.find((component) => component.type === componentType);
    if (!target) {
      throw new BadRequestException(
        "This Proposal has no components yet — call POST /creative/proposals/:proposalId/components first.",
      );
    }

    const isCover = componentType === "COVER";
    let render;
    try {
      render = await this.conceptualRender.generate({
        conceptName:
          (target.content.conceptName as string | undefined) ?? proposal.conceptName ?? "",
        atmosferaDesejada: proposal.diagnosticoCriativo.atmosferaDesejada,
        estiloPredominante: proposal.diagnosticoCriativo.estiloPredominante,
        paletaSugerida: proposal.diagnosticoCriativo.paletaSugerida,
        venueName: venue.name,
        environmentTitle: isCover ? undefined : (target.content.title as string | undefined),
        environmentDescription: isCover
          ? undefined
          : (target.content.description as string | undefined),
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Conceptual render generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    const storageKey = `renders/${proposalId}/${componentType.toLowerCase()}-${randomUUID()}.png`;
    await this.storage.upload({
      key: storageKey,
      body: Buffer.from(render.imageBase64, "base64"),
      contentType: render.mimeType,
    });

    const [updatedComponent] = await this.proposalComponents.upsertMany(proposalId, [
      {
        type: componentType,
        order: target.order,
        content: { ...target.content, renderStorageKey: storageKey },
      },
    ]);
    if (!updatedComponent) throw new Error("Failed to persist the conceptual render.");

    const [withRenderUrl] = await this.attachRenderUrls([updatedComponent]);
    return withRenderUrl;
  }

  // The final proposal artifact (Sprint 4): the Proposal itself plus its 18
  // ordered ProposalComponents in a single payload, ready for a frontend to
  // render however it needs to (web page, print-to-PDF, presentation slide
  // deck, etc.). The real binary PDF artifact is the sibling endpoint below.
  @Get("proposals/:proposalId/document")
  async getProposalDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");

    const components = await this.proposalComponents.findByProposal(proposalId);
    if (components.length === 0) {
      throw new BadRequestException(
        "This Proposal has no components yet — call POST /creative/proposals/:proposalId/components first.",
      );
    }

    return { proposal, components: await this.attachRenderUrls(components) };
  }

  @Post("proposals/:proposalId/commercial")
  async upsertCommercialProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
    @Body() dto: UpsertCommercialProposalDto,
  ): Promise<CommercialProposal> {
    const record = await this.composeCommercialProposalRecord(user, proposalId, dto);
    const saved = await this.commercialProposals.upsert(record);
    await this.proposals.updateInvestmentAmount(proposalId, saved.totalInvestment);
    return saved;
  }

  @Get("proposals/:proposalId/commercial")
  async getCommercialProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ): Promise<CommercialProposal | null> {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    return this.commercialProposals.findByProposal(proposalId);
  }

  @Get("proposals/:proposalId/commercial/versions")
  async getCommercialProposalVersions(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ): Promise<CommercialProposalVersion[]> {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    const commercial = await this.commercialProposals.findByProposal(proposalId);
    if (!commercial) throw new NotFoundException("Commercial proposal not found");
    return this.commercialProposals.findVersions(proposalId);
  }

  @Post("proposals/:proposalId/commercial/status")
  async updateCommercialStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
    @Body() dto: UpdateCommercialStatusDto,
  ) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    const commercial = await this.commercialProposals.findByProposal(proposalId);
    if (!commercial) throw new NotFoundException("Commercial proposal not found");
    this.assertCommercialTransition(commercial, dto.status, dto.acknowledgeUnconfirmedData === true);

    const updatedCommercial = await this.commercialProposals.updateStatus({
      proposalId,
      status: dto.status as CommercialProposalStatus,
      action: dto.status,
      actorId: user.sub,
      notes: dto.notes,
    });
    const updatedProposal = await this.proposals.updateStatus(
      proposalId,
      dto.status === "APPROVED" ? "APPROVED" : dto.status === "REJECTED" ? "REJECTED" : dto.status,
    );
    if (dto.status === "APPROVED") {
      await Promise.all(
        updatedCommercial.suppliers.map((supplier) =>
          this.projectSuppliers.addOrUpdate(proposal.eventId, {
            supplierId: supplier.supplierId,
            status: "BOOKED",
            notes: supplier.notes ?? "Fornecedor incluído na proposta comercial aprovada.",
          }),
        ),
      );
    }
    return { commercialProposal: updatedCommercial, proposal: updatedProposal };
  }

  @Get("proposals/:proposalId/commercial/quotes")
  async getCommercialQuotes(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ): Promise<CommercialQuote[]> {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    const commercial = await this.commercialProposals.findByProposal(proposalId);
    if (!commercial) throw new NotFoundException("Commercial proposal not found");
    const quotes = await this.prisma.commercialQuote.findMany({
      where: { commercialProposalId: commercial.id, organizationId: user.organizationId },
      include: { supplier: { select: { name: true } } },
      orderBy: [{ category: "asc" }, { amount: "asc" }, { createdAt: "desc" }],
    });
    return quotes.map((quote) => ({
      id: quote.id,
      supplierId: quote.supplierId,
      supplierName: quote.supplier?.name ?? null,
      category: quote.category,
      title: quote.title,
      amount: Number(quote.amount),
      currency: quote.currency,
      source: quote.source,
      validUntil: quote.validUntil?.toISOString() ?? null,
      status: quote.status,
      notes: quote.notes,
      createdAt: quote.createdAt.toISOString(),
    }));
  }

  @Post("proposals/:proposalId/commercial/quotes")
  async createCommercialQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
    @Body() dto: CreateCommercialQuoteDto,
  ): Promise<CommercialQuote> {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    const commercial = await this.commercialProposals.findByProposal(proposalId);
    if (!commercial) throw new NotFoundException("Commercial proposal not found");
    let supplierName: string | null = null;
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: dto.supplierId, organizationId: user.organizationId, deletedAt: null },
        select: { name: true },
      });
      if (!supplier) throw new NotFoundException("Fornecedor da cotação não encontrado no catálogo da organização.");
      supplierName = supplier.name;
    }
    const quote = await this.prisma.commercialQuote.create({
      data: {
        tenantId: user.tenantId,
        organizationId: user.organizationId,
        eventId: proposal.eventId,
        commercialProposalId: commercial.id,
        supplierId: dto.supplierId ?? null,
        createdBy: user.sub,
        category: dto.category,
        title: dto.title,
        amount: dto.amount,
        currency: dto.currency ?? "BRL",
        source: dto.source ?? null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        status: dto.status as PrismaCommercialQuoteStatus ?? "DRAFT",
        notes: dto.notes ?? null,
      },
      include: { supplier: { select: { name: true } } },
    });
    return {
      id: quote.id,
      supplierId: quote.supplierId,
      supplierName: supplierName ?? quote.supplier?.name ?? null,
      category: quote.category,
      title: quote.title,
      amount: Number(quote.amount),
      currency: quote.currency,
      source: quote.source,
      validUntil: quote.validUntil?.toISOString() ?? null,
      status: quote.status,
      notes: quote.notes,
      createdAt: quote.createdAt.toISOString(),
    };
  }

  @Patch("proposals/:proposalId/commercial/quotes/:quoteId/status")
  async updateCommercialQuoteStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
    @Param("quoteId") quoteId: string,
    @Body() dto: UpdateCommercialQuoteStatusDto,
  ): Promise<CommercialQuote> {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    const commercial = await this.commercialProposals.findByProposal(proposalId);
    if (!commercial) throw new NotFoundException("Commercial proposal not found");
    const quote = await this.prisma.commercialQuote.findFirst({
      where: { id: quoteId, commercialProposalId: commercial.id, organizationId: user.organizationId },
      include: { supplier: { select: { name: true } } },
    });
    if (!quote) throw new NotFoundException("Commercial quote not found");
    const updated = await this.prisma.commercialQuote.update({
      where: { id: quote.id },
      data: { status: dto.status as PrismaCommercialQuoteStatus, notes: dto.notes ?? quote.notes },
      include: { supplier: { select: { name: true } } },
    });
    return {
      id: updated.id,
      supplierId: updated.supplierId,
      supplierName: updated.supplier?.name ?? null,
      category: updated.category,
      title: updated.title,
      amount: Number(updated.amount),
      currency: updated.currency,
      source: updated.source,
      validUntil: updated.validUntil?.toISOString() ?? null,
      status: updated.status,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  @Get("proposals/:proposalId/commercial/pdf")
  async getCommercialProposalPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ): Promise<StreamableFile> {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    const commercial = await this.commercialProposals.findByProposal(proposalId);
    if (!commercial) {
      throw new BadRequestException(
        "Commercial proposal not found — call POST /creative/proposals/:proposalId/commercial first.",
      );
    }
    const pdfBuffer = await buildCommercialProposalPdf(commercial);
    return new StreamableFile(pdfBuffer, {
      type: "application/pdf",
      disposition: `attachment; filename="proposta-comercial-${proposalId}.pdf"`,
    });
  }

  private assertCommercialTransition(
    commercial: CommercialProposal,
    nextStatus: UpdateCommercialStatusDto["status"],
    acknowledgedUnconfirmedData: boolean,
  ): void {
    const allowed: Record<UpdateCommercialStatusDto["status"], CommercialProposalStatus[]> = {
      READY: ["DRAFT", "REJECTED"],
      SENT: ["READY"],
      APPROVED: ["SENT"],
      REJECTED: ["SENT", "READY"],
    };
    if (!allowed[nextStatus].includes(commercial.status)) {
      throw new BadRequestException(
        `Commercial proposal cannot move from ${commercial.status} to ${nextStatus}.`,
      );
    }
    if (
      (nextStatus === "SENT" || nextStatus === "APPROVED") &&
      commercial.hasUnconfirmedData &&
      !acknowledgedUnconfirmedData
    ) {
      throw new BadRequestException(
        "Acknowledge unconfirmed contacts, prices or venue data before sending or approving this proposal.",
      );
    }
  }

  private async composeCommercialProposalRecord(
    user: AuthenticatedUser,
    proposalId: string,
    dto: UpsertCommercialProposalDto,
  ) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");

    const event = await this.events.findById(user.organizationId, proposal.eventId);
    if (!event) throw new NotFoundException("Event not found for this proposal");
    const [client, venue, suppliers, assignments] = await Promise.all([
      this.clients.findById(user.organizationId, event.clientId),
      this.venues.findById(user.organizationId, event.venueId),
      this.suppliers.findAll(user.organizationId).then((records) =>
        records.filter((supplier) => supplier.serviceArea.some(isRegionalServiceArea)),
      ),
      this.projectSuppliers.findByEvent(event.id),
    ]);
    if (!client) throw new NotFoundException("Client not found for this event");
    if (!venue) throw new NotFoundException("Venue not found for this event");

    const scope = dto.scope ?? "FULL_EVENT";
    const suppliersById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
    const unknownSupplierIds = dto.supplierSelections
      .map((selection) => selection.supplierId)
      .filter((supplierId) => !suppliersById.has(supplierId));
    if (unknownSupplierIds.length > 0) {
      throw new BadRequestException(
        `Fornecedor não disponível no catálogo regional ou removido: ${unknownSupplierIds.join(", ")}. Selecione novamente um fornecedor listado na tela.`,
      );
    }

    const excludedSupplierIds = dto.supplierSelections
      .filter((selection) => {
        const supplier = suppliersById.get(selection.supplierId);
        return Boolean(
          supplier && !isCommercialCategoryAllowed(scope, commercialSupplierCategoryFor(supplier.category)),
        );
      })
      .map((selection) => selection.supplierId);
    if (excludedSupplierIds.length > 0) {
      throw new BadRequestException(
        "O orçamento somente de decoração aceita flores, móveis, iluminação decorativa, itens complementares e montagem; remova fornecedores de buffet, foto/filme, DJ ou sonorização técnica.",
      );
    }

    const invalidCustomCategories = (dto.lineItems ?? [])
      .map((item) => item.category)
      .filter((category) => !isCommercialCategoryAllowed(scope, category));
    if (invalidCustomCategories.length > 0) {
      throw new BadRequestException(
        "O orçamento somente de decoração não aceita itens personalizados fora da ambientação decorativa.",
      );
    }

    const selectedSupplierIds = new Set(dto.supplierSelections.map((selection) => selection.supplierId));
    const invalidLineItemSupplierIds = (dto.lineItems ?? [])
      .map((item) => item.supplierId)
      .filter((supplierId): supplierId is string => Boolean(supplierId && !selectedSupplierIds.has(supplierId)));
    if (invalidLineItemSupplierIds.length > 0) {
      throw new BadRequestException(
        "Every custom line item supplierId must also be present in supplierSelections.",
      );
    }

    const invalidLogisticsSupplierIds = (dto.logisticsItems ?? [])
      .map((item) => item.supplierId)
      .filter((supplierId): supplierId is string => Boolean(supplierId && !selectedSupplierIds.has(supplierId)));
    if (invalidLogisticsSupplierIds.length > 0) {
      throw new BadRequestException(
        "Every logistics item supplierId must also be present in supplierSelections.",
      );
    }

    const researchedVenue = dto.venueResearchId
      ? await this.prisma.weddingVenueResearch.findFirst({
          where: { id: dto.venueResearchId, organizationId: user.organizationId, isActive: true },
        })
      : await this.prisma.weddingVenueResearch.findFirst({
          where: { organizationId: user.organizationId, name: venue.name, isActive: true },
        });
    if (dto.venueResearchId && !researchedVenue) {
      throw new NotFoundException("Researched wedding venue not found");
    }

    return buildCommercialProposalRecord({
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      proposalId,
      createdBy: user.sub,
      event,
      client,
      venue,
      researchedVenue,
      suppliers,
      assignments,
      dto,
    });
  }

  // Real PDF artifact (Sprint 5+ item 7). Never receives the Proposal
  // itself — only its components — since internal fields like wowScore
  // must never reach a client-facing document (04-ai-bible.md: "Nunca
  // exposto ao cliente"). Fetches each renderable component's actual image
  // bytes (not just a signed URL, which a PDF can't embed by reference) so
  // they end up inside the file; a missing/expired/undecodable render is
  // skipped rather than failing the whole document (see
  // proposal-pdf-builder's renderImage).
  @Get("proposals/:proposalId/document/pdf")
  async getProposalDocumentPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param("proposalId") proposalId: string,
  ): Promise<StreamableFile> {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");

    const components = await this.proposalComponents.findByProposal(proposalId);
    if (components.length === 0) {
      throw new BadRequestException(
        "This Proposal has no components yet — call POST /creative/proposals/:proposalId/components first.",
      );
    }

    const componentsWithImages: ProposalPdfComponent[] = await Promise.all(
      components.map(async (component) => {
        const renderStorageKey = component.content.renderStorageKey as string | undefined;
        const base = { type: component.type, order: component.order, content: component.content };
        if (!renderStorageKey) return base;
        try {
          return { ...base, imageBuffer: await this.storage.download(renderStorageKey) };
        } catch {
          return base;
        }
      }),
    );

    const pdfBuffer = await buildProposalPdf(componentsWithImages);
    return new StreamableFile(pdfBuffer, {
      type: "application/pdf",
      disposition: `attachment; filename="proposta-${proposalId}.pdf"`,
    });
  }

  // Computes a fresh signed download URL for a component's conceptual
  // render, if one has been generated (content.renderStorageKey) — never
  // persists the URL itself, since a signed URL eventually expires but the
  // S3 key does not.
  private async attachRenderUrls(components: ProposalComponent[]): Promise<ProposalComponent[]> {
    return Promise.all(
      components.map(async (component) => {
        const renderStorageKey = component.content.renderStorageKey as string | undefined;
        if (!isRenderableComponentType(component.type) || !renderStorageKey) return component;

        const renderImageUrl = await this.storage.getSignedDownloadUrl(renderStorageKey);
        return { ...component, content: { ...component.content, renderImageUrl } };
      }),
    );
  }

  // Narrows the Knowledge Graph styles offered to Agente 1 down to the ones
  // that are semantically closest to this event's inspiration images (real
  // pgvector similarity search — see 07-architecture-book.md), instead of
  // always dumping the full style catalog into the prompt. Falls back to the
  // full catalog whenever there is nothing to search with (no analyzed
  // images, no styles with a backfilled embedding yet) or the embeddings
  // provider itself fails (e.g. missing AI credentials) — semantic narrowing
  // is a quality improvement, never a hard requirement for generating a
  // diagnosis.
  private async selectCandidateStyles(
    organizationId: string,
    images: InspirationImage[],
    allStyles: EventStyle[],
  ): Promise<EventStyle[]> {
    const descriptions = images
      .filter((image) => image.status === "ANALYZED" && image.visionDescription)
      .map((image) => image.visionDescription as string);
    if (descriptions.length === 0) return allStyles;

    try {
      const queryEmbedding = await this.embeddings.embed(descriptions.join(" "));
      const similarStyles = await this.eventStyles.findSimilarByEmbedding(
        organizationId,
        queryEmbedding,
        SEMANTIC_SEARCH_STYLE_LIMIT,
      );
      return similarStyles.length > 0 ? similarStyles : allStyles;
    } catch (error) {
      this.logger.warn(
        `Semantic style search unavailable, falling back to the full catalog: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return allStyles;
    }
  }
}
