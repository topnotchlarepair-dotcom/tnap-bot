// FILE: src/engine/telegram.middleware.js

/**
 * SUPREME TELEGRAM MIDDLEWARE ENGINE
 * ------------------------------------
 * Allows you to:
 *  ✔ Block unauthorized users
 *  ✔ Allowlist admins/technicians
 *  ✔ Filter messages from channels/groups
 *  ✔ Pre-process update before dispatcher
 *  ✔ Drop spam / invalid updates
 *  ✔ Rate-limit per-user (future)
 */

import { logInfo, logWarn, logError } from "../utils/logger.js";

export class TelegramMiddleware {
  constructor() {
    this.middlewares = [];
  }

  // ======================================================
  // Register middleware
  // Each middleware must be: async (update) => boolean
  // Return:
  //    true  → continue
  //    false → block update
  // ======================================================
  use(fn) {
    this.middlewares.push(fn);
    logInfo("🔧 Middleware added");
  }

  // ======================================================
  // Execute middleware chain
  // ======================================================
  async run(update) {
    try {
      for (const fn of this.middlewares) {
        const ok = await fn(update);
        if (!ok) {
          logWarn("⛔ Middleware blocked update");
          return false;
        }
      }
      return true;
    } catch (err) {
      logError("❌ Middleware ERROR", err);
      return false;
    }
  }
}

// ======================================================
// EXPORT SINGLETON
// ======================================================
export const telegramMiddleware = new TelegramMiddleware();

