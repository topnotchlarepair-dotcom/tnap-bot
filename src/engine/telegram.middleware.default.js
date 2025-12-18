// FILE: src/engine/telegram.middleware.default.js

/**
 * DEFAULT MIDDLEWARE PACK for SUPREME TELEGRAM ENGINE
 * -----------------------------------------------------
 * Includes:
 *  ✔ trace injector
 *  ✔ update logger
 *  ✔ group/channel filter
 *  ✔ allowlist filter for technicians/admins
 *  ✔ drop empty/invalid updates
 */

import { telegramMiddleware } from "./telegram.middleware.js";
import { attachTraceId } from "./telegram.trace.js";
import { logInfo, logWarn } from "../utils/logger.js";

// Read allowlists from env
const ADMINS = process.env.ADMINS
  ? process.env.ADMINS.split(",").map(x => x.trim())
  : [];

const TECHNICIANS = process.env.TECHNICIANS
  ? process.env.TECHNICIANS.split(",").map(x => x.trim())
  : [];

// ======================================================
// 1. TRACE ID MIDDLEWARE
// ======================================================
telegramMiddleware.use(async update => {
  attachTraceId(update);
  return true;
});

// ======================================================
// 2. LOG ALL INCOMING UPDATES
// ======================================================
telegramMiddleware.use(async update => {
  const traceId = update.traceId;
  logInfo(`📥 Incoming update (traceId ${traceId})`);
  return true;
});

// ======================================================
// 3. BLOCK CHANNELS & ANONYMOUS CHATS
// ======================================================
telegramMiddleware.use(async update => {
  const msg = update.message;

  if (!msg) return true;

  if (!msg.from) {
    logWarn("⛔ Blocked update: no sender info");
    return false;
  }

  if (msg.chat?.type === "channel") {
    logWarn("⛔ Blocked: channels not allowed");
    return false;
  }

  return true;
});

// ======================================================
// 4. ALLOWLIST (ADMINS + TECHS)
// ======================================================
telegramMiddleware.use(async update => {
  const userId =
    update?.message?.from?.id ||
    update?.callback_query?.from?.id;

  if (!userId) return false;

  if (ADMINS.length === 0 && TECHNICIANS.length === 0) return true;

  if (ADMINS.includes(String(userId))) return true;
  if (TECHNICIANS.includes(String(userId))) return true;

  logWarn(`⛔ Blocked user ${userId} — not in allowlist`);
  return false;
});

// ======================================================
// 5. BLOCK EMPTY UPDATES
// ======================================================
telegramMiddleware.use(async update => {
  if (!update.message && !update.callback_query) {
    logWarn("⚠️ Blocked empty update");
    return false;
  }
  return true;
});


