import { Body, Controller, Get, Logger, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { EventStyle } from "@eve-os/types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import { CreateEventStyleDto, UpdateEventStyleDto } from "./dto/event-style.dto";
import { CreateMaterialDto, UpdateMaterialDto } from "./dto/material.dto";
import { CreateSupplierDto, UpdateSupplierDto } from "./dto/supplier.dto";
import { CreateVenueDto, UpdateVenueDto } from "./dto/venue.dto";
import { EventStyleRepository } from "./repositories/event-style.repository";
import { MaterialRepository } from "./repositories/material.repository";
import { SupplierRepository } from "./repositories/supplier.repository";
import { VenueRepository } from "./repositories/venue.repository";
import { buildStyleEmbeddingText } from "./style-embedding-text";

@ApiTags("knowledge-graph")
@ApiBearerAuth()
@Controller("knowledge-graph")
export class KnowledgeGraphController {
  private readonly logger = new Logger(KnowledgeGraphController.name);

  constructor(
    private readonly eventStyles: EventStyleRepository,
    private readonly materials: MaterialRepository,
    private readonly venues: VenueRepository,
    private readonly suppliers: SupplierRepository,
    private readonly embeddings: EmbeddingPort,
  ) {}

  @Get("styles")
  listStyles(@CurrentUser() user: AuthenticatedUser) {
    return this.eventStyles.findAll(user.organizationId);
  }

  @Get("styles/:id")
  async getStyle(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const style = await this.eventStyles.findById(user.organizationId, id);
    if (!style) throw new NotFoundException("EventStyle not found");
    return style;
  }

  @Post("styles")
  async createStyle(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventStyleDto) {
    const style = await this.eventStyles.create(user.tenantId, user.organizationId, {
      name: dto.name,
      description: dto.description,
      dimensionScores: dto.dimensionScores,
      paletteColors: dto.paletteColors ?? [],
      furnitureNotes: dto.furnitureNotes ?? [],
      loungeNotes: dto.loungeNotes ?? [],
      createdBy: user.sub,
    });
    await this.backfillEmbeddingBestEffort(style);
    return style;
  }

  @Patch("styles/:id")
  async updateStyle(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateEventStyleDto,
  ) {
    const existing = await this.eventStyles.findById(user.organizationId, id);
    if (!existing) throw new NotFoundException("EventStyle not found");

    const style = await this.eventStyles.update(id, { ...dto, updatedBy: user.sub });
    await this.backfillEmbeddingBestEffort(style);
    return style;
  }

  @Get("materials")
  listMaterials(@CurrentUser() user: AuthenticatedUser) {
    return this.materials.findAll(user.organizationId);
  }

  @Get("materials/:id")
  async getMaterial(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const material = await this.materials.findById(user.organizationId, id);
    if (!material) throw new NotFoundException("Material not found");
    return material;
  }

  @Post("materials")
  createMaterial(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMaterialDto) {
    return this.materials.create(user.tenantId, user.organizationId, {
      name: dto.name,
      category: dto.category,
      emotions: dto.emotions ?? [],
      seasons: dto.seasons ?? [],
      neverRecommend: dto.neverRecommend ?? false,
      compatibleStyleIds: dto.compatibleStyleIds ?? [],
      incompatibleStyleIds: dto.incompatibleStyleIds ?? [],
      estimatedUnitCost: dto.estimatedUnitCost,
      createdBy: user.sub,
    });
  }

  @Patch("materials/:id")
  async updateMaterial(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateMaterialDto,
  ) {
    const existing = await this.materials.findById(user.organizationId, id);
    if (!existing) throw new NotFoundException("Material not found");
    return this.materials.update(id, { ...dto, updatedBy: user.sub });
  }

  @Get("venues")
  listVenues(@CurrentUser() user: AuthenticatedUser) {
    return this.venues.findAll(user.organizationId);
  }

  @Get("venues/:id")
  async getVenue(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const venue = await this.venues.findById(user.organizationId, id);
    if (!venue) throw new NotFoundException("Venue not found");
    return venue;
  }

  @Post("venues")
  createVenue(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVenueDto) {
    return this.venues.create(user.tenantId, user.organizationId, {
      name: dto.name,
      structuralConstraints: dto.structuralConstraints,
      ceilingHeightMeters: dto.ceilingHeightMeters,
      powerOutlets: dto.powerOutlets,
      guestCapacity: dto.guestCapacity,
      existingFurniture: dto.existingFurniture,
      typicalClimate: dto.typicalClimate,
      recommendationNotes: dto.recommendationNotes ?? [],
      createdBy: user.sub,
    });
  }

  @Patch("venues/:id")
  async updateVenue(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateVenueDto) {
    const existing = await this.venues.findById(user.organizationId, id);
    if (!existing) throw new NotFoundException("Venue not found");
    return this.venues.update(id, { ...dto, updatedBy: user.sub });
  }

  @Get("suppliers")
  listSuppliers(@CurrentUser() user: AuthenticatedUser) {
    return this.suppliers.findAll(user.organizationId);
  }

  @Get("suppliers/:id")
  async getSupplier(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const supplier = await this.suppliers.findById(user.organizationId, id);
    if (!supplier) throw new NotFoundException("Supplier not found");
    return supplier;
  }

  @Post("suppliers")
  createSupplier(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupplierDto) {
    return this.suppliers.create(user.tenantId, user.organizationId, {
      name: dto.name,
      category: dto.category,
      performanceNotes: dto.performanceNotes,
      estimatedCost: dto.estimatedCost,
      createdBy: user.sub,
    });
  }

  @Patch("suppliers/:id")
  async updateSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    const existing = await this.suppliers.findById(user.organizationId, id);
    if (!existing) throw new NotFoundException("Supplier not found");
    return this.suppliers.update(id, { ...dto, updatedBy: user.sub });
  }

  // Maintenance endpoint: (re)computes and stores the embedding used for
  // semantic search against inspiration-image embeddings (see
  // 07-architecture-book.md). Not part of the seed script, which must not
  // depend on AI credentials to run in CI — run this once per style after
  // seeding, whenever ai keys are actually configured.
  @Post("styles/:id/backfill-embedding")
  async backfillStyleEmbedding(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const style = await this.eventStyles.findById(user.organizationId, id);
    if (!style) throw new NotFoundException("EventStyle not found");

    const embedding = await this.embeddings.embed(buildStyleEmbeddingText(style));
    await this.eventStyles.setEmbedding(style.id, embedding);
    return { id: style.id, embeddingDimensions: embedding.length };
  }

  // Keeping a style's semantic-search embedding fresh is a quality
  // improvement, never a hard requirement for create/update to succeed —
  // same graceful-degradation pattern as selectCandidateStyles in
  // CreativeController (e.g. missing AI credentials must not block admins
  // from managing the catalog).
  private async backfillEmbeddingBestEffort(style: EventStyle): Promise<void> {
    try {
      const embedding = await this.embeddings.embed(buildStyleEmbeddingText(style));
      await this.eventStyles.setEmbedding(style.id, embedding);
    } catch (error) {
      this.logger.warn(
        `Could not backfill the embedding for EventStyle ${style.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
