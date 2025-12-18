/var/folders/7y/k6xr7m6n2gn4bmkgx7m1k3580000gn/T/TemporaryItems/NSIRD_screencaptureui_QPxCMr/Снимок\ экрана\ 2025-12-17\ в\ 21.03.41.png // FILE: src/engine/telegram.queue.js
/**
 * TELEGRAM QUEUE
 * ---------------------------------------
 * Single entry point for ALL outgoing messages.
 * ❗ Only this module enqueues Telegram jobs.
 */

import { Queue } from "bullmq";
import { redisClient } from "../utils/redis.js";
import { logInfo, logError } from "../utils/logger.js";

const QUEUE_NAME = "telegram:outgoing";

export const telegramQueue = new Queue(QUEUE_NAME, {
  connection: redisClient
});

// ======================================================
// ENQUEUE JOB
// ======================================================
export async function enqueueTelegramJob(payload) {
  try {
    const job = await telegramQueue.add(
      payload.type,
      {
        ...payload,
        createdAt: Date.now()
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    logInfo("📥 Telegram job enqueued", {
      jobId: job.id,
      type: payload.type
    });

    return job.id;
  } catch (err) {
    logError("❌ Failed to enqueue Telegram job", err);
    return false;
  }
}

