// FILE: src/engine/telegram.commands.js

/**
 * SUPREME COMMAND ENGINE (EXTENDED)
 * ------------------------------------------------------
 * Handles Telegram slash-commands:
 *   ✔ /start
 *   ✔ /help
 *   ✔ /ping
 *   ✔ /debug
 *   ✔ /id
 *   ✔ /tech
 *   ✔ /job
 *
 * Response chain:
 *   command → telegramSender → queue → worker → Telegram API
 */

import { telegramSender } from "./telegram.sender.js";
import { KB } from "./telegram.keyboard.js";
import { getStreetViewUrl } from "../utils/streetview.js";
import { metrics } from "../utils/metrics.js";
import { logInfo } from "../utils/logger.js";

export class CommandEngine {
  constructor(router) {
    this.router = router;

    // Register commands
    router.onCommand("/start", this.start.bind(this));
    router.onCommand("/help", this.help.bind(this));
    router.onCommand("/ping", this.ping.bind(this));
    router.onCommand("/debug", this.debug.bind(this));

    router.onCommand("/id", this.id.bind(this));
    router.onCommand("/tech", this.tech.bind(this));
    router.onCommand("/job", this.job.bind(this));
  }

  // ======================================================
  // /start
  // ======================================================
  async start(update) {
    const chatId = update?.message?.chat?.id;
    if (!chatId) return;

    await telegramSender.text(
      chatId,
      `👋 Welcome to <b>Top Notch Dispatch Bot</b>!\n\nSystem is online and operational.`,
      null,
      2
    );
  }

  // ======================================================
  // /id — show chat ID
  // ======================================================
  async id(update) {
    const chatId = update?.message?.chat?.id;
    if (!chatId) return;

    await telegramSender.text(chatId, `Chat ID: <b>${chatId}</b>`);
  }

  // ======================================================
  // /tech — show technician selection keyboard
  // ======================================================
  async tech(update) {
    const chatId = update?.message?.chat?.id;
    if (!chatId) return;

    await telegramSender.text(
      chatId,
      "Выберите техника:",
      KB.technicians()
    );
  }

  // ======================================================
  // /job — send test job card
  // ======================================================
  async job(update) {
    const chatId = update?.message?.chat?.id;
    if (!chatId) return;

    const job = {
      clientName: "Test Client",
      phone: "123-456-7890",
      address: "123 Test Street, Los Angeles, CA",
      appliance: "Refrigerator",
      description: "Not cooling",
      visitDate: "Today",
      timeWindow: "Anytime",
      technician: null,
      status: "Waiting for technician",
    };

    // StreetView preview
    const url = getStreetViewUrl(job.address);
    if (url) {
      await telegramSender.photo(
        chatId,
        url,
        `📍 <b>${job.address}</b>\nStreetView preview`
      );
    }

    // Job card
    const card = `
<b>New Job</b>
👤 ${job.clientName}
📞 ${job.phone}
📍 ${job.address}
🖥 ${job.appliance}
⚠️ ${job.description}
⏱ ${job.visitDate} — ${job.timeWindow}

Status: ${job.status}
    `.trim();

    await telegramSender.dispatch(card, KB.technicians());
  }

  // ======================================================
  // /help — command list
  // ======================================================
  async help(update) {
    const chatId = update?.message?.chat?.id;
    if (!chatId) return;

    const text = `
📘 <b>Available Commands</b>

/start – welcome message
/help – command list
/id – show your chat ID
/tech – choose a technician
/job – send test job card
/ping – check bot status
/debug – show engine metrics
    `.trim();

    await telegramSender.text(chatId, text, null, 3);
  }

  // ======================================================
  // /ping — live status
  // ======================================================
  async ping(update) {
    const chatId = update?.message?.chat?.id;
    if (!chatId) return;

    await telegramSender.text(
      chatId,
      `🏓 Pong! Bot is alive.\nUptime: ${Math.round(
        (Date.now() - metrics.engineStart) / 1000
      )}s`
    );
  }

  // ======================================================
  // /debug — diagnostic info
  // ======================================================
  async debug(update) {
    const chatId = update?.message?.chat?.id;
    if (!chatId) return;

    const m = metrics;

    const debugText = `
🧪 <b>DEBUG METRICS</b>

Queued: ${m.telegramJobsQueued}
Success: ${m.telegramJobsSuccess}
Failed: ${m.telegramJobsFailed}

Worker Active: ${m.workerActive}
Completed: ${m.workerCompleted}
Failed: ${m.workerFailed}

RateLimit Critical: ${m.rateLimitCritical}

Engine Uptime: ${Math.round((Date.now() - m.engineStart) / 1000)}s
    `.trim();

    await telegramSender.text(chatId, debugText, null, 2);
  }
}

// Auto-register engine
import { telegramRouter } from "./telegram.router.js";
export const commandEngine = new CommandEngine(telegramRouter);

