/**
 * TELEGRAM TRANSPORT (DIRECT HTTP)
 * --------------------------------
 * Single source of truth for Telegram API calls
 * NO QUEUES. NO WORKERS. DIRECT SEND.
 */

import axios from "axios";
import { logInfo, logError } from "../utils/logger.js";

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN is not defined");
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

/* ======================================================
   SEND TEXT MESSAGE
====================================================== */
export async function telegramSendMessage(chatId, text, keyboard = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  try {
    logInfo("📤 Telegram SEND →", { chatId });

    const res = await axios.post(`${API_BASE}/sendMessage`, payload);

    logInfo("✅ Telegram SENT", {
      chatId,
      messageId: res.data?.result?.message_id
    });

    return res.data;
  } catch (err) {
    logError("❌ Telegram SEND FAILED", {
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
  const payload = {
    chat_id: chatId,
    message_id: messageId,
    text: card.text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  if (card.keyboard) {
    payload.reply_markup = card.keyboard;
  }

  try {
    logInfo("✏️ Telegram EDIT →", { chatId, messageId });

    const res = await axios.post(`${API_BASE}/editMessageText`, payload);

    logInfo("✅ Telegram EDITED", {
      chatId,
      messageId
    });

    return res.data;
  } catch (err) {
    logError("❌ Telegram EDIT FAILED", {
      chatId,
      messageId,
      error: err?.response?.data || err.message
    });
    throw err;
  }
}

/* ======================================================
   SEND PHOTO
====================================================== */
export async function telegramSendPhoto(chatId, photo, caption = "", keyboard = null) {
  const payload = {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "HTML"
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  try {
    logInfo("📸 Telegram PHOTO →", { chatId });

    const res = await axios.post(`${API_BASE}/sendPhoto`, payload);

    logInfo("✅ Telegram PHOTO SENT", {
      chatId,
      messageId: res.data?.result?.message_id
    });

    return res.data;
  } catch (err) {
    logError("❌ Telegram PHOTO FAILED", {
      chatId,
      error: err?.response?.data || err.message
    });
    throw err;
  }
}

/* ======================================================
   SEND DOCUMENT
====================================================== */
export async function telegramSendDocument(chatId, document, caption = "", keyboard = null) {
  const payload = {
    chat_id: chatId,
    document,
    caption,
    parse_mode: "HTML"
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  try {
    logInfo("📎 Telegram DOCUMENT →", { chatId });

    const res = await axios.post(`${API_BASE}/sendDocument`, payload);

    logInfo("✅ Telegram DOCUMENT SENT", {
      chatId,
      messageId: res.data?.result?.message_id
    });

    return res.data;
  } catch (err) {
    logError("❌ Telegram DOCUMENT FAILED", {
      chatId,
      error: err?.response?.data || err.message
    });
    throw err;
  }
}

