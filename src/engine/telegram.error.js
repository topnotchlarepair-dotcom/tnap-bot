// FILE: src/engine/telegram.error.js

/**
 * SUPREME V2 TELEGRAM ERROR NORMALIZER
 * ------------------------------------
 * Converts Telegram API errors into
 * predictable, structured internal objects:
 *
 * FLOOD / TOO_LONG / CHAT_NOT_FOUND / NETWORK / UNKNOWN
 */

import { logError } from "../utils/logger.js";

// ======================================================
// Normalize any Telegram error into structured format
// ======================================================
export function normalizeTelegramError(err) {
  // Network-level errors (no response)
  if (!err || !err.description) {
    return {
      type: "NETWORK",
      message: err?.message || "Network error",
      raw: err
    };
  }

  const msg = err.description;
  const lower = msg.toLowerCase();

  // FLOOD WAIT
  if (lower.includes("too many requests") || lower.includes("flood_wait")) {
    const seconds = err.parameters?.retry_after || 1;
    return {
      type: "FLOOD",
      seconds,
      raw: err
    };
  }

  // MESSAGE TOO LONG
  if (lower.includes("message is too long")) {
    return {
      type: "TOO_LONG",
      raw: err
    };
  }

  // CHAT NOT FOUND
  if (lower.includes("chat not found")) {
    return {
      type: "CHAT_NOT_FOUND",
      raw: err
    };
  }

  // BAD REQUEST (general)
  if (lower.includes("bad request")) {
    return {
      type: "BAD_REQUEST",
      message: msg,
      raw: err
    };
  }

  // FILE RELATED ERRORS
  if (lower.includes("wrong file id") || lower.includes("file")) {
    return {
      type: "FILE_ERROR",
      message: msg,
      raw: err
    };
  }

  // FALLBACK: UNKNOWN ERROR
  return {
    type: "UNKNOWN",
    message: msg,
    raw: err
  };}

