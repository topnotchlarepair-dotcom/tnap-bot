// FILE: src/index.js

/**
 * SUPREME TELEGRAM BOT — ENTRY POINT (FIXED)
 * -------------------------------------------------------
 * Loads:
 *  ✔ env variables
 *  ✔ Express server
 *  ✔ Telegram Engine
 *  ✔ Webhook controller
 *  ✔ Worker (BullMQ)
 *  ✔ All engine components (commands, callbacks, router, fsm, events)
 */

import "dotenv/config";
import express from "express";

// =====================================================
// IMPORTANT: load engines BEFORE controller & server
// This prevents cyclic imports and registers all commands
// =====================================================
import "./engine/telegram.commands.js";
import "./engine/telegram.callback.js";
import "./engine/telegram.middleware.default.js"; 
import "./engine/telegram.events.js";       // if exists
// =====================================================

import { telegramEngine } from "./engine/telegram.engine.js";
import { telegramWorker } from "./engine/telegram.worker.js";

// Controller
import { handleTelegramWebhook } from "./controllers/telegram.controller.js";

// Logs
import { logInfo } from "./utils/logger.js";

// EXPRESS APP
const app = express();
app.use(express.json());

// -----------------------------------------------------
// HEALTH CHECK
// -----------------------------------------------------
app.get("/", (req, res) => {
  res.status(200).json({ ok: true, engine: "SUPREME", timestamp: Date.now() });
});

// -----------------------------------------------------
// TELEGRAM WEBHOOK ENDPOINT
// -----------------------------------------------------
app.post("/api/telegram", handleTelegramWebhook);

// -----------------------------------------------------
// START SERVER
// -----------------------------------------------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  logInfo(`🚀 SUPREME BOT SERVER ONLINE on port ${PORT}`);

  // Start engine
  telegramEngine.startup();

  logInfo("🔧 Worker: ACTIVE");
  logInfo("📡 Webhook: READY /api/telegram");
});

