// FILE: src/services/telegram.js
/**
 * TELEGRAM TRANSPORT (LOW LEVEL)
 * ---------------------------------------
 * The ONLY place that talks to Telegram HTTP API
 */

import axios from "axios";
import { logInfo, logError } from "../utils/logger.js";

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN is not defined");
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ======================================================
// SEND TEXT
// ======================================================
export async function telegramSendMessage(chatId, text, keyboard = null) {
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: "HTML"
    };

    if (keyboard) {
      payload.reply_markup = keyboard;
    }

    await axios.post(`${API_BASE}/sendMessage`, payload);
    logInfo("📨 Telegram text sent", { chatId });

  } catch (err) {
    logError("❌ telegramSendMessage failed", err);
    throw err;
  }
}

// ======================================================
// SEND PHOTO
// ======================================================
export async function telegramSendPhoto(chatId, photo, caption = "", keyboard = null) {
  try {
    const payload = {
      chat_id: chatId,
      photo,
      caption
    };

    if (keyboard) {
      payload.reply_markup = keyboard;
    }

    await axios.post(`${API_BASE}/sendPhoto`, payload);
    logInfo("🖼 Telegram photo sent", { chatId });

  } catch (err) {
    logError("❌ telegramSendPhoto failed", err);
    throw err;
  }
}

// ======================================================
// SEND DOCUMENT
// ======================================================
export async function telegramSendDocument(chatId, document, caption = "", keyboard = null) {
  try {
    const payload = {
      chat_id: chatId,
      document,
      caption
    };

    if (keyboard) {
      payload.reply_markup = keyboard;
    }

    await axios.post(`${API_BASE}/sendDocument`, payload);
    logInfo("📎 Telegram document sent", { chatId });

  } catch (err) {
    logError("❌ telegramSendDocument failed", err);
    throw err;
  }
}

