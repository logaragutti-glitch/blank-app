import { Injectable } from "@nestjs/common";
import type { Supplier } from "@eve-os/types";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toSupplierDomain } from "../mappers/supplier.mapper";
import {
  SupplierRepository,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from "./supplier.repository";

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

  async setVenuePreference(venueId: string, supplierId: string, preferred: boolean): Promise<void> {
    if (preferred) {
      await this.prisma.venuePreferredSupplier.upsert({
        where: { venueId_supplierId: { venueId, supplierId } },
        create: { venueId, supplierId },
        update: {},
      });
      return;
    }
    await this.prisma.venuePreferredSupplier.deleteMany({ where: { venueId, supplierId } });
  }

  async appendPerformanceNote(supplierId: string, note: string): Promise<void> {
    const supplier = await this.prisma.supplier.findUniqueOrThrow({ where: { id: supplierId } });
    const performanceNotes = supplier.performanceNotes ? `${supplier.performanceNotes}\n${note}` : note;
    await this.prisma.supplier.update({ where: { id: supplierId }, data: { performanceNotes } });
  }

  async create(tenantId: string, organizationId: string, input: CreateSupplierInput): Promise<Supplier> {
    const supplier = await this.prisma.supplier.create({
      data: {
        tenantId,
        organizationId,
        name: input.name,
        category: input.category,
        performanceNotes: input.performanceNotes,
        estimatedCost: input.estimatedCost,
        createdBy: input.createdBy,
      },
      include: { venues: VENUE_ID_SELECT },
    });
    return toSupplierDomain(supplier);
  }

  async update(id: string, input: UpdateSupplierInput): Promise<Supplier> {
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: input.name,
        category: input.category,
        performanceNotes: input.performanceNotes,
        estimatedCost: input.estimatedCost,
        updatedBy: input.updatedBy,
      },
      include: { venues: VENUE_ID_SELECT },
    });
    return toSupplierDomain(supplier);
  }
}
