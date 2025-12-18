// FILE: src/index.js

/**
 * SUPREME TELEGRAM BOT — CLOUD RUN ENTRY POINT
 * -------------------------------------------------------
 * ✔ Express HTTP server (required by Cloud Run)
 * ✔ Health check endpoint
 * ✔ Telegram webhook endpoint
 * ✔ Engine + Worker bootstrap
 */

import "dotenv/config";
import express from "express";

// =====================================================
// PRELOAD ENGINE MODULES (registry side-effects)
// =====================================================
import "./engine/telegram.commands.js";
import "./engine/telegram.callback.js";
import "./engine/telegram.middleware.default.js";
// import "./engine/telegram.events.js"; // если используешь — раскомментируй
// =====================================================

// Core engine
import { telegramEngine } from "./engine/telegram.engine.js";

// Worker (BullMQ)
import "./engine/telegram.worker.js";

// Webhook controller
import { handleTelegramWebhook } from "./controllers/telegram.controller.js";

// Logger
import { logInfo } from "./utils/logger.js";

// =====================================================
// EXPRESS APP
// =====================================================
const app = express();
app.use(express.json());

// =====================================================
// HEALTH CHECK — ОБЯЗАТЕЛЬНО для Cloud Run
// =====================================================
app.get("/", (req, res) => {
  res.status(200).send("TNAP BOT OK");
});

// =====================================================
// TELEGRAM WEBHOOK ENDPOINT
// =====================================================
app.post("/api/telegram", async (req, res) => {
  try {
    await handleTelegramWebhook(req, res);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// =====================================================
// START SERVER (Cloud Run waits for PORT)
// =====================================================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  logInfo(`🚀 SUPREME BOT SERVER LISTENING ON PORT ${PORT}`);

  telegramEngine.startup();

  logInfo("📡 Webhook endpoint: /api/telegram");
  logInfo("🔧 BullMQ worker: ACTIVE");
});

