import { Controller, Get, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import { EventStyleRepository } from "./repositories/event-style.repository";
import { MaterialRepository } from "./repositories/material.repository";
import { VenueRepository } from "./repositories/venue.repository";
import { buildStyleEmbeddingText } from "./style-embedding-text";

// NOTE: `organizationId` is taken as a query param for now because there is
// no auth/tenant-resolution middleware yet (see docs/07-architecture-book.md,
// "lacuna a preencher"). Once auth exists, this should come from the
// authenticated request context instead of being caller-supplied.
@ApiTags("knowledge-graph")
@ApiQuery({ name: "organizationId", required: true })
@Controller("knowledge-graph")
export class KnowledgeGraphController {
  constructor(
    private readonly eventStyles: EventStyleRepository,
    private readonly materials: MaterialRepository,
    private readonly venues: VenueRepository,
    private readonly embeddings: EmbeddingPort,
  ) {}

  @Get("styles")
  listStyles(@Query("organizationId") organizationId: string) {
    return this.eventStyles.findAll(organizationId);
  }

  @Get("styles/:id")
  async getStyle(@Query("organizationId") organizationId: string, @Param("id") id: string) {
    const style = await this.eventStyles.findById(organizationId, id);
    if (!style) throw new NotFoundException("EventStyle not found");
    return style;
  }

  @Get("materials")
  listMaterials(@Query("organizationId") organizationId: string) {
    return this.materials.findAll(organizationId);
  }

  @Get("materials/:id")
  async getMaterial(@Query("organizationId") organizationId: string, @Param("id") id: string) {
    const material = await this.materials.findById(organizationId, id);
    if (!material) throw new NotFoundException("Material not found");
    return material;
  }

  @Get("venues")
  listVenues(@Query("organizationId") organizationId: string) {
    return this.venues.findAll(organizationId);
  }

  @Get("venues/:id")
  async getVenue(@Query("organizationId") organizationId: string, @Param("id") id: string) {
    const venue = await this.venues.findById(organizationId, id);
    if (!venue) throw new NotFoundException("Venue not found");
    return venue;
  }

  // Maintenance endpoint: (re)computes and stores the embedding used for
  // semantic search against inspiration-image embeddings (see
  // 07-architecture-book.md). Not part of the seed script, which must not
  // depend on AI credentials to run in CI — run this once per style after
  // seeding, whenever ai keys are actually configured.
  @Post("styles/:id/backfill-embedding")
  async backfillStyleEmbedding(
    @Query("organizationId") organizationId: string,
    @Param("id") id: string,
  ) {
    const style = await this.eventStyles.findById(organizationId, id);
    if (!style) throw new NotFoundException("EventStyle not found");

    const embedding = await this.embeddings.embed(buildStyleEmbeddingText(style));
    await this.eventStyles.setEmbedding(style.id, embedding);
    return { id: style.id, embeddingDimensions: embedding.length };
  }
}
