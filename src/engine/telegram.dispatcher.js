// FILE: src/engine/telegram.dispatcher.js
/**
 * TELEGRAM DISPATCHER
 * -------------------------------------------------
 * Decides WHERE update should go:
 *  - router (commands / text)
 *  - FSM (stateful flows)
 *
 * ❌ No Telegram API
 * ❌ No queue logic
 * ✅ Pure routing only
 */

import { telegramRouter } from "./telegram.router.js";
import { fsm } from "./telegram.fsm.js";
import { logInfo } from "../utils/logger.js";

class TelegramDispatcher {
  async handle(update) {
    // =====================================
    // 1. FSM has priority if active
    // =====================================
    const fsmHandled = await fsm.isActive(update);
    if (fsmHandled) {
      logInfo("🧠 FSM active — update handled by FSM");
      return true;
    }

    // =====================================
    // 2. Router handles the rest
    // =====================================
    return telegramRouter.handle(update);
  }
}

export const telegramDispatcher = new TelegramDispatcher();

