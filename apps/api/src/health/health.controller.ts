import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from "@nestjs/terminus";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../modules/auth/public.decorator";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024)]);
  }
}
