import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { HealthModule } from "./health/health.module";
import { AiModule } from "./infrastructure/ai/ai.module";
import { EmailModule } from "./infrastructure/email/email.module";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";
import { StorageModule } from "./infrastructure/storage/storage.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BriefingModule } from "./modules/briefing/briefing.module";
import { CreativeModule } from "./modules/creative/creative.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { FilesModule } from "./modules/files/files.module";
import { KnowledgeGraphModule } from "./modules/knowledge-graph/knowledge-graph.module";
import { ProductionModule } from "./modules/production/production.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { TeamModule } from "./modules/team/team.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { singleLine: true } },
        redact: ["req.headers.authorization"],
      },
    }),
    PrismaModule,
    StorageModule,
    AiModule,
    EmailModule,
    AuthModule,
    HealthModule,
    KnowledgeGraphModule,
    BriefingModule,
    CreativeModule,
    FeedbackModule,
    ProjectsModule,
    ProductionModule,
    TasksModule,
    TeamModule,
    FilesModule,
  ],
})
export class AppModule {}
