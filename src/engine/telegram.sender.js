// FILE: src/engine/telegram.sender.js
/**
 * TELEGRAM SENDER — QUEUE ONLY
 * ----------------------------------
 * ❌ NO direct Telegram API
 * ❌ NO jobDispatcher
 * ✅ Single path: enqueue → worker
 */

import { enqueueTelegramJob } from "./telegram.queue.js";
import { TELEGRAM_JOB_TYPES } from "./telegram.types.js";

export const telegramSender = {

  async text(chatId, text, keyboard = null, priority = 3) {
    return enqueueTelegramJob({
      type: TELEGRAM_JOB_TYPES.TEXT,
      chatId,
      text,
      keyboard,
      priority
    });
  },

  async photo(chatId, photo, caption = "", keyboard = null, priority = 3) {
    return enqueueTelegramJob({
      type: TELEGRAM_JOB_TYPES.PHOTO,
      chatId,
      photo,
      caption,
      keyboard,
      priority
    });
  },

  async document(chatId, document, caption = "", keyboard = null, priority = 3) {
    return enqueueTelegramJob({
      type: TELEGRAM_JOB_TYPES.DOCUMENT,
      chatId,
      document,
      caption,
      keyboard,
      priority
    });
  },

  async alert(chatId, text) {
    return enqueueTelegramJob({
      type: TELEGRAM_JOB_TYPES.ALERT,
      chatId,
      text,
      priority: 1
    });
  },

  async jobcard(chatId, text, keyboard = null) {
    return enqueueTelegramJob({
      type: TELEGRAM_JOB_TYPES.JOBCARD,
      chatId,
      text,
      keyboard,
      priority: 1
    });
  }
};

