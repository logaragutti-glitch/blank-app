import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, PrismaHealthIndicator } from "@nestjs/terminus";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../infrastructure/prisma/prisma.service";
import { Public } from "../modules/auth/public.decorator";
import { StorageHealthIndicator } from "./storage-health.indicator";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly db: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly storage: StorageHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024),
      () => this.db.pingCheck("database", this.prisma),
      () => this.storage.isHealthy("storage"),
    ]);
  }
}
