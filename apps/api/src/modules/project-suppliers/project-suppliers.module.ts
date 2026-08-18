import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { ProjectSuppliersController } from "./project-suppliers.controller";
import { PrismaProjectSupplierRepository } from "./repositories/prisma-project-supplier.repository";
import { ProjectSupplierRepository } from "./repositories/project-supplier.repository";
import { PrismaSupplierPerformanceReviewRepository } from "./repositories/prisma-supplier-performance-review.repository";
import { SupplierPerformanceReviewRepository } from "./repositories/supplier-performance-review.repository";

@Module({
  imports: [BriefingModule, KnowledgeGraphModule],
  controllers: [ProjectSuppliersController],
  providers: [
    { provide: ProjectSupplierRepository, useClass: PrismaProjectSupplierRepository },
    { provide: SupplierPerformanceReviewRepository, useClass: PrismaSupplierPerformanceReviewRepository },
  ],
  exports: [ProjectSupplierRepository, SupplierPerformanceReviewRepository],
})
export class ProjectSuppliersModule {}
