// FILE: src/engine/telegram.chunker.js

/**
 * SUPREME MESSAGE CHUNKER
 * ------------------------------------
 * Telegram limit: max 4096 characters per message.
 * Чтобы избежать ошибок "message is too long",
 * мы разбиваем текст на безопасные части (3500 chars).
 */

const CHUNK_SIZE = 3500;

/**
 * Splits a long string into safe Telegram chunks.
 */
export function chunkText(text, size = CHUNK_SIZE) {
  if (!text || typeof text !== "string") return [""];

  const chunks = [];

  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.substring(i, i + size));
  }

  return chunks;
}

