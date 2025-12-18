// FILE: src/engine/telegram.router.js
/**
 * TELEGRAM ROUTER
 * -------------------------------------------------
 * Routes incoming updates to:
 *  - commands
 *  - callbacks
 *  - message handlers
 *
 * ❌ No direct Telegram API
 * ❌ No jobDispatcher
 * ✅ Uses telegramSender only
 */

import { telegramSender } from "./telegram.sender.js";
import { logInfo, logWarn } from "../utils/logger.js";

class TelegramRouter {
  async handle(update) {
    // ===============================
    // CALLBACK QUERIES
    // ===============================
    if (update.callback_query) {
      return this.handleCallback(update.callback_query);
    }

    // ===============================
    // TEXT MESSAGES
    // ===============================
    if (update.message && update.message.text) {
      return this.handleText(update.message);
    }

    return false;
  }

  // ======================================================
  // HANDLE TEXT
  // ======================================================
  async handleText(message) {
    const chatId = message.chat.id;
    const text = message.text.trim();

    // Commands
    if (text.startsWith("/")) {
      return this.handleCommand(chatId, text);
    }

    // Default: ignore plain text (FSM handles stateful flows)
    logInfo("ℹ️ Plain text ignored by router", { chatId, text });
    return false;
  }

  // ======================================================
  // HANDLE COMMANDS
  // ======================================================
  async handleCommand(chatId, command) {
    logInfo("➡️ Command received", { chatId, command });

    switch (command) {
      case "/start":
        return telegramSender.text(
          chatId,
          "✅ Bot is online. Use commands or follow instructions."
        );

      case "/ping":
        return telegramSender.text(chatId, "🏓 Pong!");

      default:
        logWarn("❓ Unknown command", { chatId, command });
        return telegramSender.text(chatId, "Unknown command.");
    }
  }

  // ======================================================
  // HANDLE CALLBACKS
  // ======================================================
  async handleCallback(callback) {
    const chatId = callback.message.chat.id;
    const data = callback.data;

    logInfo("🔘 Callback received", { chatId, data });

    // Пока без логики — FSM и dispatcher подключатся позже
    return telegramSender.text(chatId, `Callback: ${data}`);
  }
}

export const telegramRouter = new TelegramRouter();

