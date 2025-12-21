/**
 * TELEGRAM TRANSPORT — HARD FIX v2
 * Single source of truth for Telegram API
 */

import axios from "axios";
import { logInfo, logError } from "../utils/logger.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN is not defined");
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

/* ======================================================
   SEND MESSAGE (NEW MESSAGE)
====================================================== */
export async function telegramSendMessage(chatId, text, keyboard = null) {
  if (!chatId) {
    logError("❌ telegramSendMessage called with EMPTY chatId");
    return;
  }

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML"
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  logInfo("📤 TELEGRAM SEND MESSAGE", {
    chatId,
    preview: text.slice(0, 80)
  });

  try {
    const res = await axios.post(`${API_BASE}/sendMessage`, payload);
    logInfo("✅ TELEGRAM MESSAGE SENT", {
      chatId,
      messageId: res.data?.result?.message_id
    });
    return res.data;
  } catch (err) {
    logError("❌ TELEGRAM SEND FAILED", {
      chatId,
      error: err?.response?.data || err.message
    });
    throw err;
  }
}

/* ======================================================
   UPDATE MESSAGE (EDIT)
====================================================== */
export async function updateTelegramMessage(chatId, messageId, card) {
  if (!chatId || !messageId) {
    logError("❌ updateTelegramMessage missing chatId or messageId");
    return;
  }

  const payload = {
    chat_id: chatId,
    message_id: messageId,
    text: card.text,
    parse_mode: "HTML"
  };

  if (card.keyboard) {
    payload.reply_markup = card.keyboard;
  }

  logInfo("✏️ TELEGRAM EDIT MESSAGE", {
    chatId,
    messageId
  });

  try {
    await axios.post(`${API_BASE}/editMessageText`, payload);
  } catch (err) {
    logError("❌ TELEGRAM EDIT FAILED", {
      chatId,
      messageId,
      error: err?.response?.data || err.message
    });
  }
}

