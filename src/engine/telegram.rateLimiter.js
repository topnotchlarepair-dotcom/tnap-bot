// FILE: src/engine/telegram.rateLimiter.js

/**
 * SUPREME V2 DISTRIBUTED RATE LIMITER
 * -----------------------------------
 * ✔ Token Bucket mechanism over Redis
 * ✔ Handles Telegram 30 msg/sec global limit
 * ✔ Per-second distributed throttling
 * ✔ Slow mode activation under load
 * ✔ Protects queue workers from flood bans
 */

import redisClient from "../utils/redis.js";
import { logInfo, logWarn } from "../utils/logger.js";

const BUCKET_KEY = "tg:rate:bucket";
const MAX_TOKENS = 30;       // Telegram limit: ~30 req/sec
const REFILL_RATE = 30;      // refill per second
const REFILL_INTERVAL = 1000; // ms

// Used for dynamic backoff when overloaded
const SLOW_MODE_THRESHOLD = 20;
const CRITICAL_THRESHOLD = 10;

// ======================================================
// Initialize bucket on startup
// ======================================================
await redisClient.set(BUCKET_KEY, MAX_TOKENS);

// ======================================================
// Refill bucket every second (token bucket algorithm)
// ======================================================
setInterval(async () => {
  const current = parseInt(await redisClient.get(BUCKET_KEY)) || 0;
  const newTokens = Math.min(MAX_TOKENS, current + REFILL_RATE);

  await redisClient.set(BUCKET_KEY, newTokens);
}, REFILL_INTERVAL);

// ======================================================
// Main Rate Limit Checker
// RETURNS:
// { blocked: true, wait: number }
// { blocked: false }
// ======================================================
export async function checkRateLimit(traceId) {
  const tokens = parseInt(await redisClient.decr(BUCKET_KEY));

  if (tokens >= SLOW_MODE_THRESHOLD) {
    // full speed
    return { blocked: false };
  }

  if (tokens < SLOW_MODE_THRESHOLD && tokens >= CRITICAL_THRESHOLD) {
    // slow mode
    const wait = 150 + Math.random() * 200; // jitter
    logWarn(
      `⚠️ Slow Mode — ${tokens} tokens left (traceId ${traceId}) — wait ${wait}ms`
    );
    return { blocked: true, wait };
  }

  if (tokens < CRITICAL_THRESHOLD) {
    // critical throttling
    const wait = 400 + Math.random() * 400;
    logWarn(
      `🚨 CRITICAL throttling — only ${tokens} tokens left (traceId ${traceId}) — wait ${wait}ms`
    );
    return { blocked: true, wait };
  }

  return { blocked: false };
}

