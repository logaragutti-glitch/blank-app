import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { EventStyle, Material, Supplier, Venue } from "@eve-os/types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import { StoragePort } from "../../infrastructure/storage/storage.port";
import { CreateEventStyleDto, UpdateEventStyleDto } from "./dto/event-style.dto";
import { CreateMaterialDto, UpdateMaterialDto } from "./dto/material.dto";
import { CreateSupplierDto, UpdateSupplierDto } from "./dto/supplier.dto";
import { CreateVenueDto, UpdateVenueDto } from "./dto/venue.dto";
import { EventStyleRepository } from "./repositories/event-style.repository";
import { MaterialRepository } from "./repositories/material.repository";
import { SupplierRepository } from "./repositories/supplier.repository";
import { VenueRepository } from "./repositories/venue.repository";
import { buildStyleEmbeddingText } from "./style-embedding-text";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
// Real catalog photos (venue spaces, supplier work, material samples) —
// same accepted set as InspirationImage, no PDF/documents here.
const ACCEPTED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

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
    private readonly storage: StoragePort,
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
  async listMaterials(@CurrentUser() user: AuthenticatedUser) {
    const materials = await this.materials.findAll(user.organizationId);
    return Promise.all(materials.map((material) => this.attachPhotoUrls(material)));
  }

  @Get("materials/:id")
  async getMaterial(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const material = await this.requireMaterial(user.organizationId, id);
    return this.attachPhotoUrls(material);
  }

  @Post("materials")
  async createMaterial(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMaterialDto) {
    const material = await this.materials.create(user.tenantId, user.organizationId, {
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
    return this.attachPhotoUrls(material);
  }

  @Patch("materials/:id")
  async updateMaterial(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateMaterialDto,
  ) {
    await this.requireMaterial(user.organizationId, id);
    const material = await this.materials.update(id, { ...dto, updatedBy: user.sub });
    return this.attachPhotoUrls(material);
  }

  @Post("materials/:id/photos")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_PHOTO_BYTES } }))
  async uploadMaterialPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    await this.requireMaterial(user.organizationId, id);
    const key = await this.storePhoto("materials", id, file);
    const material = await this.materials.addPhotoKey(id, key);
    return this.attachPhotoUrls(material);
  }

  @Delete("materials/:id/photos")
  async deleteMaterialPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Query("key") key: string,
  ) {
    await this.requireMaterial(user.organizationId, id);
    if (!key) throw new BadRequestException("Missing required query param: key");
    const material = await this.materials.removePhotoKey(id, key);
    return this.attachPhotoUrls(material);
  }

  @Get("venues")
  async listVenues(@CurrentUser() user: AuthenticatedUser) {
    const venues = await this.venues.findAll(user.organizationId);
    return Promise.all(venues.map((venue) => this.attachPhotoUrls(venue)));
  }

  @Get("venues/:id")
  async getVenue(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const venue = await this.requireVenue(user.organizationId, id);
    return this.attachPhotoUrls(venue);
  }

  @Post("venues")
  async createVenue(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVenueDto) {
    const venue = await this.venues.create(user.tenantId, user.organizationId, {
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
    return this.attachPhotoUrls(venue);
  }

  @Patch("venues/:id")
  async updateVenue(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateVenueDto) {
    await this.requireVenue(user.organizationId, id);
    const venue = await this.venues.update(id, { ...dto, updatedBy: user.sub });
    return this.attachPhotoUrls(venue);
  }

  @Post("venues/:id/photos")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_PHOTO_BYTES } }))
  async uploadVenuePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    await this.requireVenue(user.organizationId, id);
    const key = await this.storePhoto("venues", id, file);
    const venue = await this.venues.addPhotoKey(id, key);
    return this.attachPhotoUrls(venue);
  }

  @Delete("venues/:id/photos")
  async deleteVenuePhoto(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Query("key") key: string) {
    await this.requireVenue(user.organizationId, id);
    if (!key) throw new BadRequestException("Missing required query param: key");
    const venue = await this.venues.removePhotoKey(id, key);
    return this.attachPhotoUrls(venue);
  }

  @Get("suppliers")
  async listSuppliers(@CurrentUser() user: AuthenticatedUser) {
    const suppliers = await this.suppliers.findAll(user.organizationId);
    return Promise.all(suppliers.map((supplier) => this.attachPhotoUrls(supplier)));
  }

  @Get("suppliers/:id")
  async getSupplier(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const supplier = await this.requireSupplier(user.organizationId, id);
    return this.attachPhotoUrls(supplier);
  }

  @Get("suppliers/:id/catalog")
  async listSupplierCatalog(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const supplier = await this.requireSupplier(user.organizationId, id);
    const categories = await this.suppliers.findCatalog(user.organizationId, id);
    return {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        category: supplier.category,
      },
      categories: categories ?? [],
    };
  }

  @Post("suppliers")
  async createSupplier(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupplierDto) {
    const supplier = await this.suppliers.create(user.tenantId, user.organizationId, {
      name: dto.name,
      category: dto.category,
      performanceNotes: dto.performanceNotes,
      estimatedCost: dto.estimatedCost,
      createdBy: user.sub,
    });
    return this.attachPhotoUrls(supplier);
  }

  @Patch("suppliers/:id")
  async updateSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    await this.requireSupplier(user.organizationId, id);
    const supplier = await this.suppliers.update(id, { ...dto, updatedBy: user.sub });
    return this.attachPhotoUrls(supplier);
  }

  @Post("suppliers/:id/photos")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_PHOTO_BYTES } }))
  async uploadSupplierPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    await this.requireSupplier(user.organizationId, id);
    const key = await this.storePhoto("suppliers", id, file);
    const supplier = await this.suppliers.addPhotoKey(id, key);
    return this.attachPhotoUrls(supplier);
  }

  @Delete("suppliers/:id/photos")
  async deleteSupplierPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Query("key") key: string,
  ) {
    await this.requireSupplier(user.organizationId, id);
    if (!key) throw new BadRequestException("Missing required query param: key");
    const supplier = await this.suppliers.removePhotoKey(id, key);
    return this.attachPhotoUrls(supplier);
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

  private async requireMaterial(organizationId: string, id: string): Promise<Material> {
    const material = await this.materials.findById(organizationId, id);
    if (!material) throw new NotFoundException("Material not found");
    return material;
  }

  private async requireVenue(organizationId: string, id: string): Promise<Venue> {
    const venue = await this.venues.findById(organizationId, id);
    if (!venue) throw new NotFoundException("Venue not found");
    return venue;
  }

  private async requireSupplier(organizationId: string, id: string): Promise<Supplier> {
    const supplier = await this.suppliers.findById(organizationId, id);
    if (!supplier) throw new NotFoundException("Supplier not found");
    return supplier;
  }

  // Shared upload plumbing for the three catalog entities — validates the
  // multipart field, checks the mime type against ACCEPTED_PHOTO_MIME_TYPES,
  // and writes to StoragePort under `${prefix}/${entityId}/...`, mirroring
  // FilesController.uploadFile's storage-key scheme.
  private async storePhoto(prefix: "venues" | "materials" | "suppliers", entityId: string, file?: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded (expected multipart field "file").');
    }
    if (!ACCEPTED_PHOTO_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Accepted: ${ACCEPTED_PHOTO_MIME_TYPES.join(", ")}`,
      );
    }
    const key = `${prefix}/${entityId}/${randomUUID()}-${file.originalname}`;
    await this.storage.upload({ key, body: file.buffer, contentType: file.mimetype });
    return key;
  }

  // Computes fresh signed download URLs for every photoKey — never
  // persisted, same pattern as FilesController.attachFileUrl /
  // BriefingController.attachImageUrl.
  private async attachPhotoUrls<T extends { photoKeys: string[] }>(entity: T): Promise<T & { photoUrls: string[] }> {
    const photoUrls = await Promise.all(entity.photoKeys.map((key) => this.storage.getSignedDownloadUrl(key)));
    return { ...entity, photoUrls };
  }
}
