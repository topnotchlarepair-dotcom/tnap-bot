// FILE: src/controllers/telegram.controller.js
/**
 * TELEGRAM WEBHOOK CONTROLLER
 * ---------------------------------------
 * Entry point for Telegram updates.
 *
 * ❌ No Telegram API calls
 * ❌ No business logic
 * ❌ No queue logic
 * ✅ Passes update to engine
 * ✅ Responds 200 OK immediately
 */

import { telegramEngine } from "../engine/telegram.engine.js";
import { logInfo, logError } from "../utils/logger.js";

export async function handleTelegramWebhook(req, res) {
  try {
    // Telegram requires instant 200 OK
    res.sendStatus(200);

    const update = req.body;
    if (!update) return;

    logInfo("📩 Incoming Telegram update");

    await telegramEngine.handleUpdate(update);

  } catch (err) {
    logError("❌ Telegram webhook controller error", err);
  }
}

