import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { StoragePort } from "../../infrastructure/storage/storage.port";
import { EmbeddingPort } from "./ai/embedding.port";
import { VisionAnalysisPort } from "./ai/vision-analysis.port";
import { CreateBriefingDto } from "./dto/create-briefing.dto";
import { ClientRepository } from "./repositories/client.repository";
import { EventRepository } from "./repositories/event.repository";
import { InspirationImageRepository } from "./repositories/inspiration-image.repository";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// NOTE: tenantId/organizationId are query params for now — same temporary
// arrangement as KnowledgeGraphController, until auth/tenant-resolution
// middleware exists.
@ApiTags("briefing")
@ApiQuery({ name: "tenantId", required: true })
@ApiQuery({ name: "organizationId", required: true })
@Controller("briefing")
export class BriefingController {
  constructor(
    private readonly clients: ClientRepository,
    private readonly events: EventRepository,
    private readonly images: InspirationImageRepository,
    private readonly storage: StoragePort,
    private readonly visionAnalysis: VisionAnalysisPort,
    private readonly embeddings: EmbeddingPort,
  ) {}

  @Post()
  async createBriefing(
    @Query("tenantId") tenantId: string,
    @Query("organizationId") organizationId: string,
    @Body() dto: CreateBriefingDto,
  ) {
    const client = await this.clients.create({
      tenantId,
      organizationId,
      partnerOneName: dto.partnerOneName,
      partnerTwoName: dto.partnerTwoName,
      partnerOneProfession: dto.partnerOneProfession,
      partnerTwoProfession: dto.partnerTwoProfession,
      city: dto.city,
      religion: dto.religion,
      hobbies: dto.hobbies,
      howTheyMet: dto.howTheyMet,
      proposalStory: dto.proposalStory,
      familyTradition: dto.familyTradition,
      lifestyleTags: dto.lifestyleTags,
      likesBeach: dto.likesBeach,
      likesCountryside: dto.likesCountryside,
      budgetAmount: dto.budgetAmount,
      budgetCurrency: dto.budgetCurrency,
      dietaryRestrictions: dto.dietaryRestrictions,
      accessibilityNeeds: dto.accessibilityNeeds,
    });

    const event = await this.events.create({
      tenantId,
      organizationId,
      clientId: client.id,
      venueId: dto.venueId,
      type: dto.eventType,
      guestsExpected: dto.guestsExpected,
      ceremonyDateTime: dto.ceremonyDateTime ? new Date(dto.ceremonyDateTime) : undefined,
      budgetAmount: dto.budgetAmount,
    });

    return { client, event };
  }

  @Post(":eventId/inspiration-images")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async uploadInspirationImage(
    @Query("tenantId") tenantId: string,
    @Query("organizationId") organizationId: string,
    @Param("eventId") eventId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded (expected multipart field "file").');
    }
    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported image type "${file.mimetype}". Accepted: ${ACCEPTED_IMAGE_MIME_TYPES.join(", ")}`,
      );
    }

    const event = await this.events.findById(organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");

    const storageKey = `inspiration/${eventId}/${randomUUID()}-${file.originalname}`;

    // Persist the PENDING record before attempting storage/AI so a failure in
    // either step is recorded as a FAILED image with its error, instead of
    // an unhandled 500 that leaves no trace of the upload attempt.
    let image = await this.images.create({
      tenantId,
      organizationId,
      eventId,
      storageKey,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    try {
      await this.storage.upload({ key: storageKey, body: file.buffer, contentType: file.mimetype });

      const analysis = await this.visionAnalysis.analyze({
        base64: file.buffer.toString("base64"),
        mimeType: file.mimetype,
      });
      image = await this.images.updateAnalysis(image.id, {
        status: "ANALYZED",
        visionTags: analysis.tags,
        visionDescription: analysis.description,
      });

      const embedding = await this.embeddings.embed(analysis.description);
      await this.images.setEmbedding(image.id, embedding);
    } catch (error) {
      image = await this.images.updateAnalysis(image.id, {
        status: "FAILED",
        processingError: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return image;
  }

  @Get(":eventId/inspiration-images")
  async listInspirationImages(
    @Query("organizationId") organizationId: string,
    @Param("eventId") eventId: string,
  ) {
    return this.images.findByEvent(organizationId, eventId);
  }
}
