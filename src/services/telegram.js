л/**
 * TELEGRAM TRANSPORT — HARD FIX v3 (FINAL)
 * --------------------------------------
 * Single source of truth for Telegram API
 * ✔ Full response logging
 * ✔ Explicit ok / error handling
 * ✔ Supports text, edit, photo, callback ACK
 * ✔ Zero silent failures
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
    logError("❌ telegramSendMessage: EMPTY chatId");
    return null;
  }

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML"
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  logInfo("📤 TELEGRAM → sendMessage", {
    chatId,
    preview: text?.slice(0, 80)
  });

  try {
    const res = await axios.post(`${API_BASE}/sendMessage`, payload);

    if (!res.data?.ok) {
      logError("❌ TELEGRAM API REJECTED sendMessage", {
        chatId,
        response: res.data
      });
      return null;
    }

    logInfo("✅ TELEGRAM sendMessage OK", {
      chatId,
      messageId: res.data.result.message_id
    });

    return res.data.result;
  } catch (err) {
    logError("❌ TELEGRAM sendMessage FAILED", {
      chatId,
      error: err?.response?.data || err.message
    });
    throw err;
  }
}

/* ======================================================
   EDIT MESSAGE (DISPATCH CARD UPDATE)
====================================================== */
export async function updateTelegramMessage(chatId, messageId, card) {
  if (!chatId || !messageId) {
    logError("❌ updateTelegramMessage: missing chatId or messageId", {
      chatId,
      messageId
    });
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

  logInfo("✏️ TELEGRAM → editMessageText", {
    chatId,
    messageId
  });

  try {
    const res = await axios.post(`${API_BASE}/editMessageText`, payload);

    if (!res.data?.ok) {
      logError("❌ TELEGRAM API REJECTED editMessageText", {
        chatId,
        messageId,
        response: res.data
      });
    }
  } catch (err) {
    logError("❌ TELEGRAM editMessageText FAILED", {
      chatId,
      messageId,
      error: err?.response?.data || err.message
    });
  }
}

/* ======================================================
   SEND PHOTO (Street View, etc.)
====================================================== */
export async function telegramSendPhoto(chatId, photoUrl, caption = "", keyboard = null) {
  if (!chatId || !photoUrl) {
    logError("❌ telegramSendPhoto: missing chatId or photoUrl");
    return null;
  }

  const payload = {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: "HTML"
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  logInfo("📸 TELEGRAM → sendPhoto", {
    chatId,
    photo: photoUrl
  });

  try {
    const res = await axios.post(`${API_BASE}/sendPhoto`, payload);

    if (!res.data?.ok) {
      logError("❌ TELEGRAM API REJECTED sendPhoto", {
        chatId,
        response: res.data
      });
      return null;
    }

    logInfo("✅ TELEGRAM sendPhoto OK", {
      chatId,
      messageId: res.data.result.message_id
    });

    return res.data.result;
  } catch (err) {
    logError("❌ TELEGRAM sendPhoto FAILED", {
      chatId,
      error: err?.response?.data || err.message
    });
    throw err;
  }
}

/* ======================================================
   ANSWER CALLBACK QUERY (FSM BUTTON ACK)
====================================================== */
export async function telegramAnswerCallback(callbackQueryId) {
  if (!callbackQueryId) return;

  try {
    await axios.post(`${API_BASE}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId
    });
  } catch (err) {
    logError("❌ TELEGRAM answerCallbackQuery FAILED", {
      error: err?.response?.data || err.message
    });
  }
}

