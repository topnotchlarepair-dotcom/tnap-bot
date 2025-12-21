// FILE: src/utils/redis.js
/**
 * REDIS CLIENT (SINGLETON)
 * ---------------------------------------
 * Used by:
 *  - BullMQ Queue
 *  - BullMQ Worker
 *  - FSM
 *
 * IMPORTANT:
 * BullMQ REQUIRES maxRetriesPerRequest = null
 */

import IORedis from "ioredis";
import { logInfo, logError } from "./logger.js";

const REDIS_URL =
  process.env.REDIS_URL ||
  "redis://127.0.0.1:6379";

export const redisClient = new IORedis(REDIS_URL, {
  // 🔥 CRITICAL for BullMQ
  maxRetriesPerRequest: null,

  // recommended for workers / blocking ops
  enableReadyCheck: false,

  // optional, but stabilizes local/dev
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

redisClient.on("connect", () => {
  logInfo("🔌 Redis connected");
});

redisClient.on("ready", () => {
  logInfo("⚡ Redis ready");
});

redisClient.on("error", err => {
  logError("❌ Redis error", err);
});

export default redisClient;

