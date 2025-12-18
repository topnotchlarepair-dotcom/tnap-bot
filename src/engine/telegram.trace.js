// FILE: src/engine/telegram.trace.js

/**
 * SUPREME TRACE ID MODULE
 * ------------------------------------
 * ✔ Creates a unique traceId for every job/message
 * ✔ Helps track the entire lifecycle across:
 *    - queue
 *    - worker
 *    - transport
 *    - rate limiter
 *    - logger
 * ✔ Essential for distributed tracing in production
 */

import crypto from "crypto";

/**
 * Generate a globally unique traceId
 */
export function createTraceId() {
  return crypto.randomUUID();
}

/**
 * Ensures a job ALWAYS has a traceId
 */
export function attachTraceId(job) {
  if (!job) return job;
  if (!job.traceId) job.traceId = crypto.randomUUID();
  return job;
}

