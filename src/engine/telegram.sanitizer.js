// FILE: src/engine/telegram.sanitizer.js

/**
 * SUPREME HTML SANITIZER FOR TELEGRAM
 * ------------------------------------
 * ✔ Prevents HTML injection
 * ✔ Ensures Telegram-safe formatting
 * ✔ Escapes critical symbols (< > & ")
 */

export function sanitizeHTML(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/&/g, "&amp;")   // MUST be first
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

