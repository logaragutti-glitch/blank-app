import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";
import { httpRequestDurationSeconds, httpRequestsTotal } from "./metrics.registry";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const start = process.hrtime.bigint();
    const record = () => this.record(request, response, start);

    return next.handle().pipe(tap({ next: record, error: record }));
  }

  private record(request: Request, response: Response, start: bigint): void {
    // request.route is only set once Nest has matched a route, which is
    // guaranteed by the time an interceptor's pipeline runs — falls back to
    // the raw URL for the rare case a request never reaches routing (e.g. a
    // malformed request rejected earlier in the pipeline).
    const route = (request.route as { path?: string } | undefined)?.path ?? request.url;
    const labels = { method: request.method, route, status_code: String(response.statusCode) };
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, Number(process.hrtime.bigint() - start) / 1e9);
  }
}
