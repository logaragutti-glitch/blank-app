import { randomUUID } from "node:crypto";
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
import type { EventStyle, InspirationImage, ProposalComponent } from "@eve-os/types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import { StoragePort } from "../../infrastructure/storage/storage.port";
import { ClientRepository } from "../briefing/repositories/client.repository";
import { EventRepository } from "../briefing/repositories/event.repository";
import { InspirationImageRepository } from "../briefing/repositories/inspiration-image.repository";
import { EventStyleRepository } from "../knowledge-graph/repositories/event-style.repository";
import { MaterialRepository } from "../knowledge-graph/repositories/material.repository";
import { VenueRepository } from "../knowledge-graph/repositories/venue.repository";
import { ConceptualRenderPort } from "./ai/conceptual-render.port";
import { DiagnosticoCriativoPort } from "./ai/diagnostico-criativo.port";
import { ProposalComponentsPort } from "./ai/proposal-components.port";
import { UpdateProposalComponentDto } from "./dto/update-proposal-component.dto";
import { buildProposalComponents } from "./proposal-component-builder";
import { buildProposalPdf, type ProposalPdfComponent } from "./proposal-pdf-builder";
import {
  RENDERABLE_COMPONENT_TYPES,
  type RenderableComponentType,
  isRenderableComponentType,
} from "./renderable-component-types";
import { ProposalComponentRepository } from "./repositories/proposal-component.repository";
import { ProposalRepository } from "./repositories/proposal.repository";
import { computeWowScore } from "./wow-score";

const SEMANTIC_SEARCH_STYLE_LIMIT = 5;

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
    private readonly proposals: ProposalRepository,
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
        .map((image) => ({ visionTags: image.visionTags, visionDescription: image.visionDescription })),
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
      candidateStyles.find((style) => style.id === result.matchedEventStyleId)?.dimensionScores ?? null;

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
  async approveProposal(@CurrentUser() user: AuthenticatedUser, @Param("proposalId") proposalId: string) {
    const proposal = await this.proposals.findById(user.organizationId, proposalId);
    if (!proposal) throw new NotFoundException("Proposal not found");
    return this.proposals.updateStatus(proposalId, "APPROVED");
  }

  @Post("proposals/:proposalId/reject")
  async rejectProposal(@CurrentUser() user: AuthenticatedUser, @Param("proposalId") proposalId: string) {
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
        conceptName: (target.content.conceptName as string | undefined) ?? proposal.conceptName ?? "",
        atmosferaDesejada: proposal.diagnosticoCriativo.atmosferaDesejada,
        estiloPredominante: proposal.diagnosticoCriativo.estiloPredominante,
        paletaSugerida: proposal.diagnosticoCriativo.paletaSugerida,
        venueName: venue.name,
        environmentTitle: isCover ? undefined : (target.content.title as string | undefined),
        environmentDescription: isCover ? undefined : (target.content.description as string | undefined),
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
      { type: componentType, order: target.order, content: { ...target.content, renderStorageKey: storageKey } },
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
