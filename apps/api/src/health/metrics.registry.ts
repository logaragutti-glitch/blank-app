import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

// One shared registry for the whole process — collectDefaultMetrics adds
// Node's standard process/event-loop metrics for free, no extra code.
export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests processed.",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds.",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});
