import { Injectable } from "@nestjs/common";
import type { ProjectFile } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toProjectFileDomain } from "../mappers/project-file.mapper";
import { ProjectFileRepository, type CreateProjectFileInput } from "./project-file.repository";

@Injectable()
export class PrismaProjectFileRepository implements ProjectFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEvent(eventId: string): Promise<ProjectFile[]> {
    const files = await this.prisma.projectFile.findMany({
      where: { eventId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return files.map(toProjectFileDomain);
  }

  async findById(id: string): Promise<ProjectFile | null> {
    const file = await this.prisma.projectFile.findFirst({ where: { id, deletedAt: null } });
    return file ? toProjectFileDomain(file) : null;
  }

  async create(input: CreateProjectFileInput): Promise<ProjectFile> {
    const file = await this.prisma.projectFile.create({
      data: {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        eventId: input.eventId,
        storageKey: input.storageKey,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        createdBy: input.createdBy,
      },
    });
    return toProjectFileDomain(file);
  }

  async softDelete(id: string, updatedBy: string | null): Promise<void> {
    await this.prisma.projectFile.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  }
}
