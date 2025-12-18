// FILE: src/engine/telegram.transport.js

/**
 * SUPREME TELEGRAM TRANSPORT (TNAP STANDARD)
 * ----------------------------------------------------
 * Low-level API → Telegram Bot API
 * Called ONLY from worker, never directly.
 */

import axios from "axios";
import { logInfo, logError } from "../utils/logger.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

class TelegramTransport {

  // ======================================================
  // SEND TEXT
  // ======================================================
  async sendText(data) {
    const { chatId, text, keyboard, traceId } = data;

    try {
      const res = await axios.post(`${API}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined
      });

      logInfo(`📨 TEXT SENT (traceId ${traceId})`);
      return res.data;

    } catch (err) {
      logError(`❌ TELEGRAM API TEXT ERROR (traceId ${traceId})`, err.response?.data || err);
      throw err;
    }
  }

  // ======================================================
  // SEND PHOTO
  // ======================================================
  async sendPhoto(data) {
    const { chatId, photo, caption, keyboard, traceId } = data;

    try {
      const res = await axios.post(`${API}/sendPhoto`, {
        chat_id: chatId,
        photo,
        caption,
        parse_mode: "HTML",
        reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined
      });

      logInfo(`📸 PHOTO SENT (traceId ${traceId})`);
      return res.data;

    } catch (err) {
      logError(`❌ TELEGRAM API PHOTO ERROR (traceId ${traceId})`, err.response?.data || err);
      throw err;
    }
  }

  // ======================================================
  // SEND DOCUMENT
  // ======================================================
  async sendDocument(data) {
    const { chatId, document, caption, keyboard, traceId } = data;

    try {
      const res = await axios.post(`${API}/sendDocument`, {
        chat_id: chatId,
        document,
        caption,
        parse_mode: "HTML",
        reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined
      });

      logInfo(`📄 DOCUMENT SENT (traceId ${traceId})`);
      return res.data;

    } catch (err) {
      logError(`❌ TELEGRAM API DOCUMENT ERROR (traceId ${traceId})`, err.response?.data || err);
      throw err;
    }
  }

  // ======================================================
  // SEND LOCATION
  // ======================================================
  async sendLocation(data) {
    const { chatId, lat, lon, keyboard, traceId } = data;

    try {
      const res = await axios.post(`${API}/sendLocation`, {
        chat_id: chatId,
        latitude: lat,
        longitude: lon,
        reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined
      });

      logInfo(`📍 LOCATION SENT (traceId ${traceId})`);
      return res.data;

    } catch (err) {
      logError(`❌ TELEGRAM API LOCATION ERROR (traceId ${traceId})`, err.response?.data || err);
      throw err;
    }
  }

  // ======================================================
  // JOB CARD (same as text but structured)
  // ======================================================
  async sendJobCard(data) {
    return await this.sendText(data);
  }

}

export const telegramTransport = new TelegramTransport();

