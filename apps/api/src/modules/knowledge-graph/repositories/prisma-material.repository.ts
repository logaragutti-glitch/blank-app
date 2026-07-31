import { Injectable } from "@nestjs/common";
import type { Material } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toMaterialDomain } from "../mappers/material.mapper";
import {
  MaterialRepository,
  type CreateMaterialInput,
  type UpdateMaterialInput,
} from "./material.repository";

const STYLE_ID_SELECT = { select: { id: true } } as const;
const WITH_STYLE_IDS = { compatibleStyles: STYLE_ID_SELECT, incompatibleStyles: STYLE_ID_SELECT } as const;

@Injectable()
export class PrismaMaterialRepository implements MaterialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<Material[]> {
    const materials = await this.prisma.material.findMany({
      where: { organizationId, deletedAt: null },
      include: WITH_STYLE_IDS,
      orderBy: { name: "asc" },
    });
    return materials.map(toMaterialDomain);
  }

  async findById(organizationId: string, id: string): Promise<Material | null> {
    const material = await this.prisma.material.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: WITH_STYLE_IDS,
    });
    return material ? toMaterialDomain(material) : null;
  }

  async create(tenantId: string, organizationId: string, input: CreateMaterialInput): Promise<Material> {
    const material = await this.prisma.material.create({
      data: {
        tenantId,
        organizationId,
        name: input.name,
        category: input.category,
        emotions: input.emotions,
        seasons: input.seasons,
        neverRecommend: input.neverRecommend,
        estimatedUnitCost: input.estimatedUnitCost,
        createdBy: input.createdBy,
        compatibleStyles: { connect: input.compatibleStyleIds.map((id) => ({ id })) },
        incompatibleStyles: { connect: input.incompatibleStyleIds.map((id) => ({ id })) },
      },
      include: WITH_STYLE_IDS,
    });
    return toMaterialDomain(material);
  }

  async update(id: string, input: UpdateMaterialInput): Promise<Material> {
    const material = await this.prisma.material.update({
      where: { id },
      data: {
        name: input.name,
        category: input.category,
        emotions: input.emotions,
        seasons: input.seasons,
        neverRecommend: input.neverRecommend,
        estimatedUnitCost: input.estimatedUnitCost,
        updatedBy: input.updatedBy,
        compatibleStyles:
          input.compatibleStyleIds === undefined ? undefined : { set: input.compatibleStyleIds.map((id) => ({ id })) },
        incompatibleStyles:
          input.incompatibleStyleIds === undefined
            ? undefined
            : { set: input.incompatibleStyleIds.map((id) => ({ id })) },
      },
      include: WITH_STYLE_IDS,
    });
    return toMaterialDomain(material);
  }
}
