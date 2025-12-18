// FILE: src/bootstrap.js

/**
 * SUPREME BOOTSTRAP (TNAP STANDARD)
 * -------------------------------------------------------
 * Loads environment variables, validates critical env vars,
 * initializes global metrics and logs startup status.
 */

import "dotenv/config";
import { logInfo, logError } from "./utils/logger.js";
import redisClient from "./utils/redis.js";

// --------------------------------------------------------
// Validate required environment variables
// --------------------------------------------------------

const requiredEnv = ["BOT_TOKEN"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    logError(`❌ Missing required ENV variable: ${key}`);
    throw new Error(`Missing ENV: ${key}`);
  }
}

// --------------------------------------------------------
// Redis connectivity check
// --------------------------------------------------------

redisClient.on("error", err => {
  logError("❌ Redis connection error", err);
});

redisClient.on("ready", () => {
  logInfo("🔌 Redis connected");
});

// --------------------------------------------------------
// Global metrics object
// --------------------------------------------------------

export const metrics = {
  engineStart: Date.now(),
  telegramJobsQueued: 0,
  telegramJobsSuccess: 0,
  telegramJobsFailed: 0,
  workerActive: 0,
  workerCompleted: 0,
  workerFailed: 0,
  rateLimitCritical: 0,
};

// --------------------------------------------------------
// Startup log
// --------------------------------------------------------

logInfo("🚀 TNAP Bot bootstrap initialized");

