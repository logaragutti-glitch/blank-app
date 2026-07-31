import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { CreativeModule } from "../creative/creative.module";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module";
import { ProjectsController } from "./projects.controller";

@Module({
  imports: [BriefingModule, KnowledgeGraphModule, CreativeModule],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
