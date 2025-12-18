// FILE: src/engine/telegram.events.js

/**
 * SUPREME TELEGRAM EVENTS ENGINE
 * ---------------------------------------------------------
 * Handles:
 *   ✔ photo uploads
 *   ✔ documents
 *   ✔ videos
 *   ✔ audio
 *   ✔ voice messages
 *   ✔ location
 *
 * Events go through:
 *   router → event registry → FSM → handlers
 */

import { telegramSender } from "./telegram.sender.js";
import { logInfo, logError } from "../utils/logger.js";
import { fsm } from "./telegram.fsm.js";
import { telegramRouter } from "./telegram.router.js";

// ======================================================
// HELPER: Extract file_id from event
// ======================================================
function getFileId(msg) {
  if (msg.photo) return msg.photo[msg.photo.length - 1].file_id;
  if (msg.document) return msg.document.file_id;
  if (msg.audio) return msg.audio.file_id;
  if (msg.voice) return msg.voice.file_id;
  if (msg.video) return msg.video.file_id;
  return null;
}

// ======================================================
// PHOTO HANDLER
// ======================================================
telegramRouter.onEvent("photo", async update => {
  const msg = update.message;
  const chatId = msg.chat.id;

  const fileId = getFileId(msg);

  logInfo("📸 Photo received", { chatId, fileId });

  // Forward to FSM step (if active)
  const state = await fsm.getState(chatId);
  if (state) {
    await fsm.handle(update);
    return;
  }

  // No FSM active → default behavior
  await telegramSender.text(chatId, "Фото получено! 👍");
});

// ======================================================
// DOCUMENT HANDLER
// ======================================================
telegramRouter.onEvent("document", async update => {
  const msg = update.message;
  const chatId = msg.chat.id;

  const fileId = getFileId(msg);

  logInfo("📄 Document received", { chatId, fileId });

  const state = await fsm.getState(chatId);
  if (state) {
    await fsm.handle(update);
    return;
  }

  await telegramSender.text(chatId, "Документ получен! 👍");
});

// ======================================================
// LOCATION HANDLER
// ======================================================
telegramRouter.onEvent("location", async update => {
  const msg = update.message;
  const chatId = msg.chat.id;

  const lat = msg.location.latitude;
  const lon = msg.location.longitude;

  logInfo("📍 Location received", { chatId, lat, lon });

  const state = await fsm.getState(chatId);
  if (state) {
    await fsm.handle(update);
    return;
  }

  await telegramSender.text(chatId, `Координаты получены: ${lat}, ${lon}`);
});

// ======================================================
// VOICE / AUDIO
// ======================================================
telegramRouter.onEvent("voice", async update => {
  const chatId = update.message.chat.id;
  logInfo("🎤 Voice message received");

  const state = await fsm.getState(chatId);
  if (state) {
    await fsm.handle(update);
    return;
  }

  await telegramSender.text(chatId, "Голосовое получено! 👍");
});

telegramRouter.onEvent("audio", async update => {
  const chatId = update.message.chat.id;
  logInfo("🎧 Audio file received");

  const state = await fsm.getState(chatId);
  if (state) {
    await fsm.handle(update);
    return;
  }

  await telegramSender.text(chatId, "Аудио получено!");
});

// ======================================================
// VIDEO
// ======================================================
telegramRouter.onEvent("video", async update => {
  const chatId = update.message.chat.id;
  logInfo("🎥 Video received");

  const state = await fsm.getState(chatId);
  if (state) {
    await fsm.handle(update);
    return;
  }

  await telegramSender.text(chatId, "Видео получено!");
});

