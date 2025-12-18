// FILE: src/engine/telegram.types.js
/**
 * TELEGRAM JOB TYPES
 * ---------------------------------------
 * Single source of truth for queue → worker.
 * Types here MUST be supported by telegram.worker.js
 */

export const TELEGRAM_JOB_TYPES = {
  TEXT: "text",
  PHOTO: "photo",
  DOCUMENT: "document",
  ALERT: "alert",
  JOBCARD: "jobcard"
};

// ======================================================
// VALIDATION
// ======================================================
export function validateJobType(job) {
  if (!job || !job.type) return false;
  return Object.values(TELEGRAM_JOB_TYPES).includes(job.type);
}

// ======================================================
// JOB FACTORY (OPTIONAL, SAFE)
// ======================================================
export const JobFactory = {

  text(chatId, text, keyboard = null, priority = 3) {
    return {
      type: TELEGRAM_JOB_TYPES.TEXT,
      chatId,
      text,
      keyboard,
      priority
    };
  },

  photo(chatId, photo, caption = "", keyboard = null, priority = 3) {
    return {
      type: TELEGRAM_JOB_TYPES.PHOTO,
      chatId,
      photo,
      caption,
      keyboard,
      priority
    };
  },

  document(chatId, document, caption = "", keyboard = null, priority = 3) {
    return {
      type: TELEGRAM_JOB_TYPES.DOCUMENT,
      chatId,
      document,
      caption,
      keyboard,
      priority
    };
  },

  alert(chatId, text) {
    return {
      type: TELEGRAM_JOB_TYPES.ALERT,
      chatId,
      text,
      priority: 1
    };
  },

  jobcard(chatId, text, keyboard = null) {
    return {
      type: TELEGRAM_JOB_TYPES.JOBCARD,
      chatId,
      text,
      keyboard,
      priority: 1
    };
  }
};

