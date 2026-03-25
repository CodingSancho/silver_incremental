import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from "prom-client";

export const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const httpRequestCounter = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route"],
  registers: [registry],
});

export const incrementCounter = new Counter({
  name: "counter_increments_total",
  help: "Total number of counter increments",
  registers: [registry],
});

export const cooldownRejections = new Counter({
  name: "cooldown_rejections_total",
  help: "Total number of rejected increments due to cooldown",
  registers: [registry],
});
