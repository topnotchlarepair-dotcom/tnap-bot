// FILE: src/engine/telegram.fsm.js

/**
 * SUPREME FSM ENGINE (FINITE STATE MACHINE)
 * -----------------------------------------
 * ✔ Stores user state in Redis
 * ✔ Supports multi-step wizards
 * ✔ Works with text, photo, callback, documents
 * ✔ Fully async + distributed-safe
 * ✔ Integrated with router + callbackEngine
 */

import redisClient from "../utils/redis.js";
import { logInfo, logWarn, logError } from "../utils/logger.js";
import { telegramSender } from "./telegram.sender.js";

const FSM_PREFIX = "tg:fsm:"; // Redis key prefix

export class FSMSupreme {
  constructor() {
    this.steps = {}; // { stepName: handlerFn }
  }

  // ======================================================
  // Register FSM step
  // ======================================================
  on(stepName, handlerFn) {
    this.steps[stepName] = handlerFn;
    logInfo(`📌 FSM step registered: ${stepName}`);
  }

  // ======================================================
  // Save state
  // ======================================================
  async setState(chatId, step, data = {}) {
    const key = FSM_PREFIX + chatId;

    await redisClient.set(
      key,
      JSON.stringify({
        step,
        data,
        updated: Date.now()
      })
    );

    logInfo(`🔄 FSM setState: ${chatId} → ${step}`);
  }

  // ======================================================
  // Load state
  // ======================================================
  async getState(chatId) {
    const key = FSM_PREFIX + chatId;
    const raw = await redisClient.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // ======================================================
  // Drop state (finish flow)
  // ======================================================
  async dropState(chatId) {
    await redisClient.del(FSM_PREFIX + chatId);
    logInfo(`🗑 FSM state cleared for ${chatId}`);
  }

  // ======================================================
  // Main FSM handler
  // Called from dispatcher AFTER router/callback
  // ======================================================
  async handle(update) {
    try {
      const chatId =
        update?.message?.chat?.id ||
        update?.callback_query?.message?.chat?.id;

      if (!chatId) return;

      const state = await this.getState(chatId);

      if (!state) return; // user not in FSM mode

      const currentStep = state.step;
      const handler = this.steps[currentStep];

      if (!handler) {
        logWarn(`⚠️ FSM: No handler for step: ${currentStep}`);
        return;
      }

      logInfo(`🎛 FSM RUN → step: ${currentStep}`);

      // Execute step handler
      return await handler({
        update,
        chatId,
        stateData: state.data,
        fsm: this
      });

    } catch (err) {
      logError("❌ FSM ERROR", err);
    }
  }

  // ======================================================
  // Helper: start a flow
  // ======================================================
  async start(chatId, step, data = {}) {
    await this.setState(chatId, step, data);
    logInfo(`🚀 FSM started for ${chatId} at ${step}`);
  }

  // ======================================================
  // Helper: go to next step
  // ======================================================
  async next(chatId, step, mergeData = {}) {
    const state = await this.getState(chatId);
    const newData = { ...(state?.data || {}), ...mergeData };
    await this.setState(chatId, step, newData);
  }
}

// ======================================================
// EXPORT SINGLETON
// ======================================================
export const fsm = new FSMSupreme();

