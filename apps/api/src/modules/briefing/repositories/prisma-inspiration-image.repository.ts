import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { InspirationImage } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toInspirationImageDomain } from "../mappers/inspiration-image.mapper";
import {
  InspirationImageRepository,
  type CreateInspirationImageInput,
  type UpdateInspirationImageAnalysisInput,
} from "./inspiration-image.repository";

@Injectable()
export class PrismaInspirationImageRepository implements InspirationImageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateInspirationImageInput): Promise<InspirationImage> {
    const image = await this.prisma.inspirationImage.create({ data: input });
    return toInspirationImageDomain(image);
  }

  async findById(organizationId: string, id: string): Promise<InspirationImage | null> {
    const image = await this.prisma.inspirationImage.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return image ? toInspirationImageDomain(image) : null;
  }

  async findByEvent(organizationId: string, eventId: string): Promise<InspirationImage[]> {
    const images = await this.prisma.inspirationImage.findMany({
      where: { eventId, organizationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return images.map(toInspirationImageDomain);
  }

  async findByOrganization(organizationId: string): Promise<InspirationImage[]> {
    const images = await this.prisma.inspirationImage.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return images.map(toInspirationImageDomain);
  }

  async updateAnalysis(
    id: string,
    input: UpdateInspirationImageAnalysisInput,
  ): Promise<InspirationImage> {
    const image = await this.prisma.inspirationImage.update({
      where: { id },
      data: {
        status: input.status,
        visionTags: (input.visionTags ?? undefined) as Prisma.InputJsonValue | undefined,
        visionDescription: input.visionDescription ?? undefined,
        processingError: input.processingError ?? undefined,
      },
    });
    return toInspirationImageDomain(image);
  }

  // `embedding` is Unsupported("vector(1536)") in schema.prisma, so Prisma
  // Client cannot read/write it through the normal query API — pgvector's
  // literal syntax is `[v1,v2,...]`, passed as a parameterized value (never
  // string-concatenated) to avoid SQL injection.
  async setEmbedding(id: string, embedding: number[]): Promise<void> {
    const vectorLiteral = `[${embedding.join(",")}]`;
    await this.prisma.$executeRaw`
      UPDATE inspiration_images
      SET embedding = ${vectorLiteral}::vector
      WHERE id = ${id}::uuid
    `;
  }
}
