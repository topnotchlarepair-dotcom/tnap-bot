/**
 * Очень простой и надёжный дедупликатор.
 * Держим кэш событий в памяти Cloud Run контейнера.
 * Каждый ID хранится 2 минуты — хватает для Google Calendar webhook.
 */

const eventCache = new Map();

// TTL хранения ID события
const TTL = 2 * 60 * 1000; // 2 минуты

export function isDuplicateEvent(eventId) {
  if (!eventId) return false;

  const now = Date.now();

  if (eventCache.has(eventId)) {
    const timestamp = eventCache.get(eventId);

    // Если запись свежая — это дубликат
    if (now - timestamp < TTL) {
      return true;
    }
  }

  // Если записи нет, или старая — обновляем и пропускаем
  eventCache.set(eventId, now);

  // Автоочистка лишнего (без утечки памяти)
  cleanupCache(now);

  return false;
}

/**
 * Удаляем старые ключи, чтобы кэш не разрастался
 */
function cleanupCache(now) {
  for (const [id, timestamp] of eventCache.entries()) {
    if (now - timestamp > TTL) {
      eventCache.delete(id);
    }
  }
}

