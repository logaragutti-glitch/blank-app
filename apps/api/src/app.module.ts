import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";
import { KnowledgeGraphModule } from "./modules/knowledge-graph/knowledge-graph.module";

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
    HealthModule,
    KnowledgeGraphModule,
  ],
})
export class AppModule {}
