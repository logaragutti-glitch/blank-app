import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { ProjectSuppliersController } from "./project-suppliers.controller";
import { PrismaProjectSupplierRepository } from "./repositories/prisma-project-supplier.repository";
import { ProjectSupplierRepository } from "./repositories/project-supplier.repository";

@Module({
  imports: [BriefingModule, KnowledgeGraphModule],
  controllers: [ProjectSuppliersController],
  providers: [{ provide: ProjectSupplierRepository, useClass: PrismaProjectSupplierRepository }],
  exports: [ProjectSupplierRepository],
})
export class ProjectSuppliersModule {}
