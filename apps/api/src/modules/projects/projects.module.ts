import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { CreativeModule } from "../creative/creative.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { ProductionModule } from "../production/production.module";
import { TasksModule } from "../tasks/tasks.module";
import { ProjectSuppliersModule } from "../project-suppliers/project-suppliers.module";
import { ProjectsController } from "./projects.controller";

@Module({
  imports: [
    BriefingModule,
    KnowledgeGraphModule,
    CreativeModule,
    ProductionModule,
    TasksModule,
    ProjectSuppliersModule,
  ],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
