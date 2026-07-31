import { Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import { EventStyleRepository } from "./repositories/event-style.repository";
import { MaterialRepository } from "./repositories/material.repository";
import { SupplierRepository } from "./repositories/supplier.repository";
import { VenueRepository } from "./repositories/venue.repository";
import { buildStyleEmbeddingText } from "./style-embedding-text";

@ApiTags("knowledge-graph")
@ApiBearerAuth()
@Controller("knowledge-graph")
export class KnowledgeGraphController {
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
}
