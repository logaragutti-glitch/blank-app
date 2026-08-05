import { Module } from "@nestjs/common";
import { BriefingModule } from "../briefing/briefing.module";
import { FilesController } from "./files.controller";
import { PrismaProjectFileRepository } from "./repositories/prisma-project-file.repository";
import { ProjectFileRepository } from "./repositories/project-file.repository";

// StoragePort comes from the global StorageModule — not imported here.
@Module({
  imports: [BriefingModule],
  controllers: [FilesController],
  providers: [{ provide: ProjectFileRepository, useClass: PrismaProjectFileRepository }],
  exports: [ProjectFileRepository],
})
export class FilesModule {}
