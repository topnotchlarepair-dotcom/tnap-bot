// FILE: src/engine/telegram.worker.js
/**
 * TELEGRAM WORKER
 * ---------------------------------------
 * The ONLY place that talks to Telegram API.
 * Consumes jobs from telegram.queue.js
 */

import { Worker } from "bullmq";
import { redisClient } from "../utils/redis.js";
import { logInfo, logError } from "../utils/logger.js";
import { TELEGRAM_JOB_TYPES } from "./telegram.types.js";
import {
  telegramSendMessage,
  telegramSendPhoto,
  telegramSendDocument
} from "../services/telegram.js";

// ❗ BullMQ queue name MUST NOT contain ":"
const QUEUE_NAME = "telegram_outgoing";

export const telegramWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const {
      type,
      chatId,
      text,
      photo,
      document,
      caption,
      keyboard
    } = job.data;

    try {
      switch (type) {
        case TELEGRAM_JOB_TYPES.TEXT:
        case TELEGRAM_JOB_TYPES.ALERT:
        case TELEGRAM_JOB_TYPES.JOBCARD:
          await telegramSendMessage(chatId, text, keyboard);
          break;

        case TELEGRAM_JOB_TYPES.PHOTO:
          await telegramSendPhoto(chatId, photo, caption, keyboard);
          break;

        case TELEGRAM_JOB_TYPES.DOCUMENT:
          await telegramSendDocument(chatId, document, caption, keyboard);
          break;

        default:
          logError("❌ Unknown Telegram job type", { type });
          break;
      }

      logInfo("✅ Telegram job processed", {
        jobId: job.id,
        type
      });

    } catch (err) {
      logError("❌ Telegram worker error", err);
      throw err;
    }
  },
  {
    connection: redisClient
  }
);

// ======================================================
// Worker lifecycle logs
// ======================================================
telegramWorker.on("ready", () => {
  logInfo("🚀 Telegram worker ONLINE");
});

telegramWorker.on("failed", (job, err) => {
  logError("❌ Telegram job FAILED", {
    jobId: job?.id,
    error: err?.message
  });
});

