import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { EmbeddingPort } from "../../infrastructure/ai/embedding.port";
import { StoragePort } from "../../infrastructure/storage/storage.port";
import { VisionAnalysisPort } from "./ai/vision-analysis.port";
import { CreateBriefingDto } from "./dto/create-briefing.dto";
import { ClientRepository } from "./repositories/client.repository";
import { EventRepository } from "./repositories/event.repository";
import { InspirationImageRepository } from "./repositories/inspiration-image.repository";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

@ApiTags("briefing")
@ApiBearerAuth()
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
  async createBriefing(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBriefingDto) {
    const client = await this.clients.create({
      tenantId: user.tenantId,
      organizationId: user.organizationId,
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
      tenantId: user.tenantId,
      organizationId: user.organizationId,
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
    @CurrentUser() user: AuthenticatedUser,
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

    const event = await this.events.findById(user.organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");

    const storageKey = `inspiration/${eventId}/${randomUUID()}-${file.originalname}`;

    // Persist the PENDING record before attempting storage/AI so a failure in
    // either step is recorded as a FAILED image with its error, instead of
    // an unhandled 500 that leaves no trace of the upload attempt.
    let image = await this.images.create({
      tenantId: user.tenantId,
      organizationId: user.organizationId,
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
  async listInspirationImages(@CurrentUser() user: AuthenticatedUser, @Param("eventId") eventId: string) {
    return this.images.findByEvent(user.organizationId, eventId);
  }
}
