import { Injectable } from "@nestjs/common";
import type { Material } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toMaterialDomain } from "../mappers/material.mapper";
import { MaterialRepository } from "./material.repository";

const STYLE_ID_SELECT = { select: { id: true } } as const;

@Injectable()
export class PrismaMaterialRepository implements MaterialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<Material[]> {
    const materials = await this.prisma.material.findMany({
      where: { organizationId, deletedAt: null },
      include: { compatibleStyles: STYLE_ID_SELECT, incompatibleStyles: STYLE_ID_SELECT },
      orderBy: { name: "asc" },
    });
    return materials.map(toMaterialDomain);
  }

  async findById(organizationId: string, id: string): Promise<Material | null> {
    const material = await this.prisma.material.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { compatibleStyles: STYLE_ID_SELECT, incompatibleStyles: STYLE_ID_SELECT },
    });
    return material ? toMaterialDomain(material) : null;
  }
}
