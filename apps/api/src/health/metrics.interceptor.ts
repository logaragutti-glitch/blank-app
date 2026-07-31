import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, catchError, tap, throwError } from "rxjs";
import { httpRequestDurationSeconds, httpRequestsTotal } from "./metrics.registry";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap({ next: () => this.record(request, response.statusCode, start) }),
      catchError((error: unknown) => {
        // On the error path, Nest's exception filter hasn't run yet, so
        // response.statusCode is still its pre-error default (200) — the
        // real status has to be read off the exception itself instead.
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        this.record(request, statusCode, start);
        return throwError(() => error);
      }),
    );
  }

  private record(request: Request, statusCode: number, start: bigint): void {
    // request.route is only set once Nest has matched a route, which is
    // guaranteed by the time an interceptor's pipeline runs — falls back to
    // the raw URL for the rare case a request never reaches routing (e.g. a
    // malformed request rejected earlier in the pipeline).
    const route = (request.route as { path?: string } | undefined)?.path ?? request.url;
    const labels = { method: request.method, route, status_code: String(statusCode) };
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, Number(process.hrtime.bigint() - start) / 1e9);
  }
}
