// FILE: src/engine/telegram.dispatch.js

/**
 * SUPREME DISPATCH MODULE V8
 * ------------------------------------------------------
 * Handles full dispatch workflow:
 *  ✔ Normalize job
 *  ✔ Attach traceId
 *  ✔ Build SUPREME job card
 *  ✔ Send StreetView preview
 *  ✔ Attach navigation / status / technician keyboards
 *  ✔ Push final card via telegramSender (queue → worker)
 */

import "../bootstrap.js";
import { JobCard } from "./telegram.jobcard.js";
import { KB } from "./telegram.keyboard.js";
import { telegramSender } from "./telegram.sender.js";
import { attachTraceId } from "./telegram.trace.js";

import { logInfo, logWarn, logError } from "../utils/logger.js";

export class DispatchEngine {

  // ======================================================
  // NORMALIZE JOB OBJECT
  // ======================================================
  normalize(job) {
    if (!job || typeof job !== "object") {
      throw new Error("DispatchEngine.normalize(): invalid job");
    }

    return {
      id: job.id ?? "N/A",
      clientName: job.clientName ?? "Unknown",
      phone: job.phone ?? "-",
      address: job.address ?? "-",
      appliance: job.appliance ?? "-",
      brand: job.brand ?? "",
      model: job.model ?? "",
      serial: job.serial ?? "",
      description: job.description ?? "",
      visitDate: job.visitDate ?? "Not set",
      timeWindow: job.timeWindow ?? "Anytime",
      technician: job.technician ?? "Unassigned",
      status: job.status ?? "Pending"
    };
  }

  // ======================================================
  // MAIN DISPATCH METHOD
  // ======================================================
  async send(job, chatId, includeStreet = true) {
    try {
      // Normalize
      const cleanJob = this.normalize(job);

      // Attach traceId
      attachTraceId(cleanJob);

      logInfo(`📨 DISPATCH START (traceId ${cleanJob.traceId})`, {
        job: cleanJob
      });

      // --------------------------------------------------
      // 1. SEND STREETVIEW PREVIEW
      // --------------------------------------------------
      if (includeStreet && cleanJob.address) {
        try {
          await telegramSender.photoPreview(cleanJob.address, chatId);
        } catch (err) {
          logWarn("⚠️ StreetView preview failed", err);
        }
      }

      // --------------------------------------------------
      // 2. BUILD JOB CARD TEXT
      // --------------------------------------------------
      const card = JobCard.build(cleanJob);

      // --------------------------------------------------
      // 3. ATTACH KEYBOARDS
      // Navigation + Technicians + Status + Parts
      // --------------------------------------------------
      const mergedKeyboard = KB.merge(
        KB.navigation(cleanJob.address),
        KB.technicians(),
        KB.status(cleanJob.id),
        KB.parts(cleanJob.id)
      );

      // --------------------------------------------------
      // 4. SEND FINAL CARD
      // --------------------------------------------------
      await telegramSender.text(
        chatId,
        card,
        mergedKeyboard,
        2
      );

      logInfo(`✅ DISPATCH COMPLETE (traceId ${cleanJob.traceId})`);

      return true;

    } catch (err) {
      logError("❌ DISPATCH FATAL ERROR", err);
      return false;
    }
  }
}

// Export singleton
export const dispatchEngine = new DispatchEngine();

