// FILE: src/engine/telegram.commands.js
/**
 * SUPREME COMMAND ENGINE (PURE)
 * + FSM CALLBACK HANDLER
 * ------------------------------------
 * ✔ Commands (/start, /job, etc.)
 * ✔ FSM callback_query handler
 * ✔ No router assumptions
 */

import { telegramSender } from "./telegram.sender.js";
import { KB } from "./telegram.keyboard.js";
import { getStreetViewUrl } from "../utils/streetview.js";
import { metrics } from "../utils/metrics.js";
import { logInfo, logError } from "../utils/logger.js";

import { processFSMEvent } from "../fsm/telegram.fsm.js";
import { getJobById } from "../storage/jobs.js";

export class CommandEngine {
  constructor() {
    logInfo("📌 CommandEngine initialized (commands + FSM callbacks)");
  }

  // ======================================================
  // ENTRY POINT (called by engine)
  // ======================================================
  async handle(update, next) {
    // 1️⃣ FSM CALLBACKS (buttons)
    if (update?.callback_query) {
      return this.handleCallback(update.callback_query);
    }

    // 2️⃣ TEXT COMMANDS
    const text = update?.message?.text;
    if (!text || !text.startsWith("/")) {
      return next?.();
    }

    const command = text.trim().split(" ")[0];

    switch (command) {
      case "/start":
        return this.start(update);
      case "/help":
        return this.help(update);
      case "/ping":
        return this.ping(update);
      case "/debug":
        return this.debug(update);
      case "/id":
        return this.id(update);
      case "/tech":
        return this.tech(update);
      case "/job":
        return this.job(update);
      default:
        return next?.();
    }
  }

  // ======================================================
  // FSM CALLBACK HANDLER
  // ======================================================
  async handleCallback(cb) {
    try {
      // ACK callback immediately
      await telegramSender.answerCallback(cb.id);

      if (!cb.data) return;

      let payload;
      try {
        payload = JSON.parse(cb.data);
      } catch {
        return;
      }

      const { event, jobId, techId } = payload;
      if (!event || !jobId) return;

      const job = await getJobById(jobId);
      if (!job) return;

      const role = this.resolveRole(cb.from.id, job);
      if (!role) return;

      const fsmPayload = {};
      if (techId) {
        fsmPayload.tech = job.availableTechs?.find(t => t.id === techId);
      }

      await processFSMEvent({
        jobId,
        event,
        role,
        payload: fsmPayload
      });
    } catch (err) {
      logError("FSM callback error", err);
    }
  }

  // ======================================================
  // ROLE RESOLUTION
  // ======================================================
  resolveRole(telegramUserId, job) {
    if (telegramUserId === job.dispatcherTelegramId) {
      return "DISPATCHER";
    }

    if (
      job.assignedTech &&
      telegramUserId === job.assignedTech.telegramId
    ) {
      return "TECHNICIAN";
    }

    return null;
  }

  // ======================================================
  // HELPERS
  // ======================================================
  getChatId(update) {
    return update?.message?.chat?.id;
  }

  // ======================================================
  // COMMANDS
  // ======================================================
  async start(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;

    await telegramSender.text(
      chatId,
      `👋 Welcome to <b>Top Notch Dispatch Bot</b>\n\nSystem online.`,
      null,
      2
    );
  }

  async id(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;
    await telegramSender.text(chatId, `Chat ID: <b>${chatId}</b>`);
  }

  async tech(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;
    await telegramSender.text(chatId, "Выберите техника:", KB.technicians());
  }

  async job(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;

    const job = {
      clientName: "Test Client",
      phone: "123-456-7890",
      address: "123 Test Street, Los Angeles, CA",
      appliance: "Refrigerator",
      description: "Not cooling",
      visitDate: "Today",
      timeWindow: "Anytime",
      status: "Waiting for technician"
    };

    const url = getStreetViewUrl(job.address);
    if (url) {
      await telegramSender.photo(
        chatId,
        url,
        `📍 <b>${job.address}</b>\nStreetView preview`
      );
    }

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

  async help(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;

    await telegramSender.text(
      chatId,
      `
📘 <b>Available Commands</b>

/start – welcome
/help – command list
/id – show chat ID
/tech – choose technician
/job – send test job
/ping – bot status
/debug – metrics
      `.trim(),
      null,
      3
    );
  }

  async ping(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;

    await telegramSender.text(
      chatId,
      `🏓 Pong!\nUptime: ${Math.round(
        (Date.now() - metrics.engineStart) / 1000
      )}s`
    );
  }

  async debug(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;

    const m = metrics;

    await telegramSender.text(
      chatId,
      `
🧪 <b>DEBUG METRICS</b>

Queued: ${m.telegramJobsQueued}
Success: ${m.telegramJobsSuccess}
Failed: ${m.telegramJobsFailed}

Worker Active: ${m.workerActive}
Completed: ${m.workerCompleted}
Failed: ${m.workerFailed}

Engine Uptime: ${Math.round((Date.now() - m.engineStart) / 1000)}s
      `.trim(),
      null,
      2
    );
  }
}

// экспортируем ИНСТАНС
export const commandEngine = new CommandEngine();

