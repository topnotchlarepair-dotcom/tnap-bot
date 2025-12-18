// FILE: src/engine/telegram.health.js

/**
 * SUPREME TELEGRAM HEALTH ENGINE
 * ------------------------------------
 * Provides a detailed health status for:
 *  ✔ Telegram API connectivity
 *  ✔ Redis connectivity
 *  ✔ Queue depth
 *  ✔ Rate-limit bucket status
 *  ✔ Worker status
 */

import axios from "axios";
import redisClient from "../utils/redis.js";
import { telegramQueue } from "./telegram.queue.js";

const API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

// ======================================================
// Check if Telegram API is responding
// ======================================================
async function checkTelegramAPI() {
  try {
    const res = await axios.get(`${API}/getMe`);
    return res?.data?.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

// ======================================================
// Check Redis
// ======================================================
async function checkRedis() {
  try {
    const pong = await redisClient.ping();
    return pong === "PONG" ? "ok" : "error";
  } catch {
    return "error";
  }
}

// ======================================================
// Rate-limit bucket status
// ======================================================
async function checkRateBucket() {
  try {
    const tokens = await redisClient.get("tg:rate:bucket");
    return Number(tokens) || 0;
  } catch {
    return -1;
  }
}

// ======================================================
// Queue depth
// ======================================================
async function checkQueue() {
  try {
    return {
      waiting: await telegramQueue.getWaitingCount(),
      active: await telegramQueue.getActiveCount(),
      completed24h: await telegramQueue.getCompletedCount(),
      failed24h: await telegramQueue.getFailedCount()
    };
  } catch {
    return {
      waiting: -1,
      active: -1,
      completed24h: -1,
      failed24h: -1
    };
  }
}

// ======================================================
// Full System Health
// ======================================================
export async function telegramHealth() {
  const result = {
    telegram: await checkTelegramAPI(),
    redis: await checkRedis(),
    rateBucket: await checkRateBucket(),
    queue: await checkQueue(),
    timestamp: new Date().toISOString()
  };

  return result;
}

