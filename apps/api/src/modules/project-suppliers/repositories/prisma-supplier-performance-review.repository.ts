import { Injectable } from "@nestjs/common";
import type { SupplierPerformanceReview as SupplierPerformanceReviewRecord } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service";
import type { SupplierPerformanceReview } from "@eve-os/types";
import {
  SupplierPerformanceReviewRepository,
  type UpsertSupplierPerformanceReviewInput,
} from "./supplier-performance-review.repository";

function toDomain(record: SupplierPerformanceReviewRecord): SupplierPerformanceReview {
  return {
    id: record.id,
    eventId: record.eventId,
    supplierId: record.supplierId,
    overallRating: record.overallRating,
    qualityRating: record.qualityRating,
    punctualityRating: record.punctualityRating,
    communicationRating: record.communicationRating,
    scopeFulfillment: record.scopeFulfillment,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaSupplierPerformanceReviewRepository extends SupplierPerformanceReviewRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByEvent(eventId: string): Promise<SupplierPerformanceReview[]> {
    const rows = await this.prisma.supplierPerformanceReview.findMany({
      where: { eventId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toDomain);
  }

  async findByEventAndSupplier(eventId: string, supplierId: string): Promise<SupplierPerformanceReview | null> {
    const row = await this.prisma.supplierPerformanceReview.findUnique({
      where: { eventId_supplierId: { eventId, supplierId } },
    });
    return row ? toDomain(row) : null;
  }

  async upsert(
    tenantId: string,
    organizationId: string,
    eventId: string,
    supplierId: string,
    input: UpsertSupplierPerformanceReviewInput,
  ): Promise<SupplierPerformanceReview> {
    const row = await this.prisma.supplierPerformanceReview.upsert({
      where: { eventId_supplierId: { eventId, supplierId } },
      update: {
        overallRating: input.overallRating ?? null,
        qualityRating: input.qualityRating ?? null,
        punctualityRating: input.punctualityRating ?? null,
        communicationRating: input.communicationRating ?? null,
        scopeFulfillment: input.scopeFulfillment ?? null,
        notes: input.notes ?? null,
      },
      create: {
        tenantId,
        organizationId,
        eventId,
        supplierId,
        overallRating: input.overallRating ?? null,
        qualityRating: input.qualityRating ?? null,
        punctualityRating: input.punctualityRating ?? null,
        communicationRating: input.communicationRating ?? null,
        scopeFulfillment: input.scopeFulfillment ?? null,
        notes: input.notes ?? null,
        createdBy: input.createdBy,
      },
    });
    return toDomain(row);
  }
}
