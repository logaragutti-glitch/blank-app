import { Injectable } from "@nestjs/common";
import type { Supplier } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toSupplierDomain } from "../mappers/supplier.mapper";
import { SupplierRepository } from "./supplier.repository";

const VENUE_ID_SELECT = { select: { venueId: true } } as const;

@Injectable()
export class PrismaSupplierRepository implements SupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<Supplier[]> {
    const suppliers = await this.prisma.supplier.findMany({
      where: { organizationId, deletedAt: null },
      include: { venues: VENUE_ID_SELECT },
      orderBy: { name: "asc" },
    });
    return suppliers.map(toSupplierDomain);
  }

  async findById(organizationId: string, id: string): Promise<Supplier | null> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { venues: VENUE_ID_SELECT },
    });
    return supplier ? toSupplierDomain(supplier) : null;
  }
}
