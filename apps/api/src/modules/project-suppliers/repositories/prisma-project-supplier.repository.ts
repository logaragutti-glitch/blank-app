import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import { toProjectSupplierDomain } from "../mappers/project-supplier.mapper";
import {
  ProjectSupplierRepository,
  type AddProjectSupplierInput,
  type ProjectSupplier,
} from "./project-supplier.repository";

@Injectable()
export class PrismaProjectSupplierRepository implements ProjectSupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEvent(eventId: string): Promise<ProjectSupplier[]> {
    const suppliers = await this.prisma.projectSupplier.findMany({
      where: { eventId },
      orderBy: { addedAt: "asc" },
    });
    return suppliers.map(toProjectSupplierDomain);
  }

  async findOne(eventId: string, supplierId: string): Promise<ProjectSupplier | null> {
    const supplier = await this.prisma.projectSupplier.findUnique({
      where: { eventId_supplierId: { eventId, supplierId } },
    });
    return supplier ? toProjectSupplierDomain(supplier) : null;
  }

  async addOrUpdate(eventId: string, input: AddProjectSupplierInput): Promise<ProjectSupplier> {
    const supplier = await this.prisma.projectSupplier.upsert({
      where: { eventId_supplierId: { eventId, supplierId: input.supplierId } },
      create: { eventId, supplierId: input.supplierId, status: input.status, notes: input.notes },
      update: { status: input.status, notes: input.notes },
    });
    return toProjectSupplierDomain(supplier);
  }

  async remove(eventId: string, supplierId: string): Promise<void> {
    await this.prisma.projectSupplier.delete({ where: { eventId_supplierId: { eventId, supplierId } } });
  }
}
