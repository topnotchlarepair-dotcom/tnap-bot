// FILE: src/utils/metrics.js

/**
 * SUPREME METRICS ENGINE
 * ------------------------------------
 * ✔ Simple in-memory counters
 * ✔ Can be exported to Prometheus in the future
 * ✔ Tracks queue + worker stats
 * ✔ Used by healthcheck and router
 */

export const metrics = {
  // Queue metrics
  telegramJobsQueued: 0,
  telegramJobsSuccess: 0,
  telegramJobsFailed: 0,

  // Worker metrics
  workerActive: 0,
  workerCompleted: 0,
  workerFailed: 0,

  // Transport-level metrics
  transportSent: 0,
  transportErrors: 0,
  transportPhotoSent: 0,
  transportTextSent: 0,

  // Rate-limit metrics
  rateLimitHits: 0,
  rateLimitCritical: 0,

  // Timestamp for uptime tracking
  engineStart: Date.now()
};

/**
 * Reset metrics (not used normally — only for dev)
 */
export function resetMetrics() {
  Object.keys(metrics).forEach(key => {
    if (typeof metrics[key] === "number") metrics[key] = 0;
  });
  metrics.engineStart = Date.now();
}

