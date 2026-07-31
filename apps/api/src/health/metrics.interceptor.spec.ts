import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { metricsRegistry } from "./metrics.registry";
import { MetricsInterceptor } from "./metrics.interceptor";

describe("MetricsInterceptor", () => {
  function makeContext(request: Record<string, unknown>, response: Record<string, unknown>): ExecutionContext {
    return {
      getType: () => "http",
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    metricsRegistry.resetMetrics();
  });

  it("records a request labeled by method, matched route, and status code", async () => {
    const interceptor = new MetricsInterceptor();
    const context = makeContext(
      { method: "GET", url: "/knowledge-graph/materials/123", route: { path: "/knowledge-graph/materials/:id" } },
      { statusCode: 200 },
    );
    const next: CallHandler = { handle: () => of({ ok: true }) };

    await new Promise<void>((resolve) => interceptor.intercept(context, next).subscribe({ complete: () => resolve() }));

    const metrics = await metricsRegistry.metrics();
    expect(metrics).toMatch(
      /http_requests_total\{method="GET",route="\/knowledge-graph\/materials\/:id",status_code="200"\} 1/,
    );
  });

  it("still records the request when the handler errors", async () => {
    const interceptor = new MetricsInterceptor();
    const context = makeContext({ method: "POST", url: "/auth/login" }, { statusCode: 500 });
    const next: CallHandler = { handle: () => throwError(() => new Error("boom")) };

    await new Promise<void>((resolve) =>
      interceptor.intercept(context, next).subscribe({ error: () => resolve() }),
    );

    const metrics = await metricsRegistry.metrics();
    expect(metrics).toMatch(/http_requests_total\{method="POST",route="\/auth\/login",status_code="500"\} 1/);
  });

  it("skips non-http contexts", async () => {
    const interceptor = new MetricsInterceptor();
    const context = { getType: () => "rpc" } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of("value") };

    const result = await new Promise((resolve) => {
      interceptor.intercept(context, next).subscribe({ next: resolve });
    });

    expect(result).toBe("value");
  });
});
