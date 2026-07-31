import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { PrismaHealthIndicator, TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";
import { MetricsController } from "./metrics.controller";
import { MetricsInterceptor } from "./metrics.interceptor";
import { StorageHealthIndicator } from "./storage-health.indicator";

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, MetricsController],
  providers: [
    PrismaHealthIndicator,
    StorageHealthIndicator,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class HealthModule {}
