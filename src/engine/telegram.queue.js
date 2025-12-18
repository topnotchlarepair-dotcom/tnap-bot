// FILE: src/engine/telegram.queue.js
/**
 * SUPREME TELEGRAM QUEUE
 * --------------------------------------------------
 * Single, clean BullMQ queue for all outgoing
 * Telegram jobs. No side effects. No corruption.
 */

import { Queue } from "bullmq";
import { redisClient } from "../utils/redis.js";
import { logInfo, logError } from "../utils/logger.js";

export const TELEGRAM_QUEUE_NAME = "telegram-queue";

export const telegramQueue = new Queue(TELEGRAM_QUEUE_NAME, {
  connection: redisClient,
});

// ======================================================
// ENQUEUE TELEGRAM JOB
// ======================================================
export async function enqueueTelegramJob(payload) {
  try {
    const job = await telegramQueue.add(
      payload.type,
      {
        ...payload,
        createdAt: Date.now(),
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    logInfo("📥 Telegram job enqueued", {
      jobId: job.id,
      type: payload.type,
    });

    return job.id;
  } catch (err) {
    logError("❌ Failed to enqueue Telegram job", err);
    return false;
  }
}

