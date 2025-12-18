// FILE: src/engine/telegram.callback.js

/**
 * SUPREME CALLBACK ENGINE V2
 * ------------------------------------------------------
 * Handles all inline-button interactions:
 *   ✔ Technician assignment
 *   ✔ Status updates
 *   ✔ Parts workflow
 *   ✔ Job completion
 *   ✔ Photo workflow trigger
 *   ✔ Fallback handling
 *   ✔ Full audit logging w/ traceId
 */

import { telegramSender } from "./telegram.sender.js";
import { logInfo, logWarn, logError } from "../utils/logger.js";
import { attachTraceId } from "./telegram.trace.js";

export class CallbackEngine {

  // ======================================================
  // MAIN ENTRY POINT
  // ======================================================
  async handle(update) {
    try {
      const query = update.callback_query;
      if (!query) return;

      // Attach traceId
      attachTraceId(update);
      const traceId = update.traceId;

      const chatId = query.message.chat.id;
      const data = query.data;

      logInfo(`🔘 CALLBACK (traceId ${traceId})`, { data });

      // Route callback by prefix
      if (data.startsWith("assign_"))      return await this.assignTechnician(chatId, data, traceId);
      if (data.startsWith("status_"))      return await this.updateStatus(chatId, data, traceId);
      if (data.startsWith("parts_"))       return await this.partsFlow(chatId, data, traceId);
      if (data.startsWith("photos_"))      return await this.photoFlow(chatId, data, traceId);
      if (data.startsWith("complete_"))    return await this.completeJob(chatId, data, traceId);
      if (data.startsWith("notcomplete_")) return await this.notCompleted(chatId, data, traceId);

      // Unknown callback
      logWarn(`⚠️ UNKNOWN CALLBACK (traceId ${traceId})`, data);
      await telegramSender.text(chatId, "⚠ Unknown action.");
      
    } catch (err) {
      logError("❌ CallbackEngine.handle() ERROR", err);
    }
  }

  // ======================================================
  // TECHNICIAN ASSIGNMENT
  // data: assign_Daniel
  // ======================================================
  async assignTechnician(chatId, data, traceId) {
    const tech = data.replace("assign_", "");

    logInfo(`👨‍🔧 Technician assigned (traceId ${traceId})`, { tech });

    await telegramSender.text(
      chatId,
      `👨‍🔧 Technician selected: <b>${tech}</b>`
    );
  }

  // ======================================================
  // STATUS UPDATE
  // data: status_<jobId>_in_progress
  // ======================================================
  async updateStatus(chatId, data, traceId) {
    const parts = data.split("_");
    const jobId = parts[1];
    const newStatus = parts.slice(2).join("_").replace(/_/g, " ");

    logInfo(`🏷 Status updated (traceId ${traceId})`, { jobId, newStatus });

    await telegramSender.text(
      chatId,
      `🏷 Job <b>#${jobId}</b> updated to: <b>${newStatus}</b>`
    );
  }

  // ======================================================
  // PARTS WORKFLOW
  // parts_<jobId>_add
  // parts_<jobId>_order
  // ======================================================
  async partsFlow(chatId, data, traceId) {
    const [_, jobId, action] = data.split("_");

    if (action === "add") {
      logInfo(`📦 Parts add requested (traceId ${traceId})`, { jobId });
      return await telegramSender.text(chatId, "📦 Send parts list:");
    }

    if (action === "order") {
      logInfo(`🛒 Parts order requested (traceId ${traceId})`, { jobId });
      return await telegramSender.text(chatId, "🛒 Dispatcher will order the parts.");
    }
  }

  // ======================================================
  // PHOTO UPLOAD FLOW
  // photos_<jobId>
  // ======================================================
  async photoFlow(chatId, data, traceId) {
    const jobId = data.replace("photos_", "");

    logInfo(`📸 Photo upload triggered (traceId ${traceId})`, { jobId });

    await telegramSender.text(
      chatId,
      `📸 Upload photos for job <b>#${jobId}</b>.\nSend images one by one.`
    );
  }

  // ======================================================
  // JOB COMPLETED
  // complete_<jobId>
  // ======================================================
  async completeJob(chatId, data, traceId) {
    const jobId = data.replace("complete_", "");

    logInfo(`🟢 Job completed (traceId ${traceId})`, { jobId });

    await telegramSender.text(
      chatId,
      `🟢 Job <b>#${jobId}</b> marked as <b>Completed</b>.`
    );
  }

  // ======================================================
  // JOB NOT COMPLETED
  // notcomplete_<jobId>
  // ======================================================
  async notCompleted(chatId, data, traceId) {
    const jobId = data.replace("notcomplete_", "");

    logInfo(`❌ Job not completed (traceId ${traceId})`, { jobId });

    await telegramSender.text(
      chatId,
      `❌ Job <b>#${jobId}</b> marked as <b>Not Completed</b>.`
    );
  }
}

// Export singleton
export const callbackEngine = new CallbackEngine();

