// FILE: src/utils/redis.js
/**
 * REDIS CLIENT (SINGLETON)
 * ---------------------------------------
 * Used by:
 *  - BullMQ Queue
 *  - BullMQ Worker
 *  - FSM
 */

import IORedis from "ioredis";
import { logInfo, logError } from "./logger.js";

const REDIS_URL =
  process.env.REDIS_URL ||
  "redis://127.0.0.1:6379";

export const redisClient = new IORedis(REDIS_URL);

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

