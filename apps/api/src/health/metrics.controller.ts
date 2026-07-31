import { Controller, Get, Header } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../modules/auth/public.decorator";
import { metricsRegistry } from "./metrics.registry";

@ApiTags("observability")
@Controller("metrics")
export class MetricsController {
  @Public()
  @Get()
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  getMetrics(): Promise<string> {
    return metricsRegistry.metrics();
  }
}
