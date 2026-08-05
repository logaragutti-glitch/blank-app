import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { ProjectFile } from "@eve-os/types";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/jwt-payload";
import { StoragePort } from "../../infrastructure/storage/storage.port";
import { EventRepository } from "../briefing/repositories/event.repository";
import { ProjectFileRepository } from "./repositories/project-file.repository";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
// Contracts, floor plans, quotes — the real documents Bia handles per
// project, not decoration photos (see InspirationImage for those).
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

// Arquivos do Projeto (Bucket C) — generic files attached to an Event,
// reusing the same StoragePort/bucket as InspirationImage but with no
// vision analysis.
@ApiTags("files")
@ApiBearerAuth()
@Controller("events/:eventId/files")
export class FilesController {
  constructor(
    private readonly events: EventRepository,
    private readonly files: ProjectFileRepository,
    private readonly storage: StoragePort,
  ) {}

  private async requireEvent(organizationId: string, eventId: string) {
    const event = await this.events.findById(organizationId, eventId);
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_FILE_BYTES } }))
  async uploadFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded (expected multipart field "file").');
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Accepted: ${ACCEPTED_MIME_TYPES.join(", ")}`,
      );
    }
    await this.requireEvent(user.organizationId, eventId);

    const storageKey = `project-files/${eventId}/${randomUUID()}-${file.originalname}`;
    await this.storage.upload({ key: storageKey, body: file.buffer, contentType: file.mimetype });

    const created = await this.files.create({
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      eventId,
      storageKey,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      createdBy: user.sub,
    });
    return this.attachFileUrl(created);
  }

  @Get()
  async listFiles(@CurrentUser() user: AuthenticatedUser, @Param("eventId") eventId: string) {
    await this.requireEvent(user.organizationId, eventId);
    const files = await this.files.findByEvent(eventId);
    return Promise.all(files.map((file) => this.attachFileUrl(file)));
  }

  @Delete(":fileId")
  @HttpCode(204)
  async deleteFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
    @Param("fileId") fileId: string,
  ) {
    await this.requireEvent(user.organizationId, eventId);
    const existing = await this.files.findById(fileId);
    if (!existing || existing.eventId !== eventId) throw new NotFoundException("File not found");

    await this.files.softDelete(fileId, user.sub);
  }

  // Computes a fresh signed download URL — never persisted, same pattern
  // as BriefingController.attachImageUrl.
  private async attachFileUrl(file: ProjectFile): Promise<ProjectFile> {
    const fileUrl = await this.storage.getSignedDownloadUrl(file.storageKey);
    return { ...file, fileUrl };
  }
}
