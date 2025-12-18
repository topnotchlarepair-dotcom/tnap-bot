// FILE: src/engine/telegram.engine.js
/**
 * SUPREME TELEGRAM ENGINE (CENTRAL PIPELINE)
 * -------------------------------------------------
 * Engine = orchestration ONLY
 * ❌ No direct Telegram API calls here
 */
import { telegramMiddleware } from "./telegram.middleware.js";
import "./telegram.middleware.default.js";
import { fsm } from "./telegram.fsm.js";
import { telegramDispatcher } from "./telegram.dispatcher.js";
import { logInfo, logWarn, logError } from "../utils/logger.js";

export class TelegramEngine {
  // ======================================================
  // CENTRAL ENTRY POINT
  // ======================================================
  async handleUpdate(update) {
    try {
      // 1. Middleware
      const allowed = await telegramMiddleware.run(update);
      if (!allowed) {
        logWarn("⛔ Update rejected by middleware");
        return false;
      }

      // 2. FSM (if active)
      await fsm.handle(update);

      // 3. Dispatcher (commands / callbacks / events)
      await telegramDispatcher.handle(update);

      // ❌ NO FALLBACK RESPONSES HERE
      // ❌ NO telegramSendMessage HERE

      return true;
    } catch (err) {
      logError("❌ TELEGRAM ENGINE ERROR", err);
      return false;
    }
  }

  // ======================================================
  // Engine startup
  // ======================================================
  startup() {
    logInfo("🚀 SUPREME TELEGRAM ENGINE ONLINE");
  }
}

export const telegramEngine = new TelegramEngine();

