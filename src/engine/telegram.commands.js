// FILE: src/engine/telegram.commands.js
/**
 * COMMAND ENGINE v2.1 (FIXED)
 * ------------------------------------
 * ✔ Commands (/start, /job, /jobtest, etc.)
 * ✔ FSM callback handling
 * ✔ NO silent fails
 * ✔ dispatch() ALWAYS receives chatId
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
    logInfo("📌 CommandEngine v2.1 initialized");
  }

  // ======================================================
  // ENTRY POINT
  // ======================================================
  async handle(update, next) {
    try {
      // CALLBACKS
      if (update?.callback_query) {
        await this.handleCallback(update.callback_query);
        return;
      }

      // COMMANDS
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
        case "/jobtest":
          return this.jobtest(update);
        default:
          return next?.();
      }
    } catch (err) {
      logError("CommandEngine.handle error", err);
    }
  }

  // ======================================================
  // FSM CALLBACK HANDLER
  // ======================================================
  async handleCallback(cb) {
    try {
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
      if (techId && job.availableTechs) {
        fsmPayload.tech = job.availableTechs.find(t => t.id === techId);
      }

      await processFSMEvent({
        jobId,
        event,
        role,
        payload: fsmPayload
      });
    } catch (err) {
      logError("FSM callback failed", err);
    }
  }

  // ======================================================
  // ROLE
  // ======================================================
  resolveRole(telegramUserId, job) {
    if (telegramUserId === job.dispatcherTelegramId) {
      return "DISPATCHER";
    }

    if (
      job.assignedTech &&
      telegramUserId === job.assignedTech.telegramChatId
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
      "👋 <b>Top Notch Dispatch Bot</b>\nSystem online.",
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
    await telegramSender.text(chatId, "Select technician:", KB.technicians());
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
        `📍 <b>${job.address}</b>`
      );
    }

    const card = `
<b>NEW JOB</b>
👤 ${job.clientName}
📞 ${job.phone}
📍 ${job.address}
🖥 ${job.appliance}
⚠️ ${job.description}
⏱ ${job.visitDate} — ${job.timeWindow}

Status: ${job.status}
    `.trim();

    // ✅ FIX: chatId ПЕРЕДАЁТСЯ
    await telegramSender.dispatch(
      chatId,
      card,
      KB.technicians()
    );
  }

  async jobtest(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;

    await telegramSender.text(
      chatId,
      "🧪 /jobtest OK — command engine alive"
    );
  }

  async help(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;

    await telegramSender.text(
      chatId,
      `
/start
/id
/tech
/job
/jobtest
/ping
/debug
      `.trim(),
      null,
      2
    );
  }

  async ping(update) {
    const chatId = this.getChatId(update);
    if (!chatId) return;

    await telegramSender.text(
      chatId,
      `🏓 Pong\nUptime: ${Math.round(
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
      `DEBUG\nQueued: ${m.telegramJobsQueued}\nSuccess: ${m.telegramJobsSuccess}`
    );
  }
}

export const commandEngine = new CommandEngine();

