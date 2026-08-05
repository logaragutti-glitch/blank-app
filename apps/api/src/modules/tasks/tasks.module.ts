import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { TasksController } from "./tasks.controller";
import { PrismaProjectTaskRepository } from "./repositories/prisma-project-task.repository";
import { ProjectTaskRepository } from "./repositories/project-task.repository";

@Module({
  imports: [BriefingModule],
  controllers: [TasksController],
  providers: [{ provide: ProjectTaskRepository, useClass: PrismaProjectTaskRepository }],
  exports: [ProjectTaskRepository],
})
export class TasksModule {}
