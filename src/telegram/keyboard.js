// FILE: src/telegram/keyboard.js
/**
 * LEGACY KEYBOARD WRAPPER (BACKWARD COMPATIBILITY)
 * ------------------------------------------------------
 * Старые модули (jobDispatcher, старые FSM и т.д.)
 * используют именно этот файл!
 *
 * Поэтому здесь мы:
 *   ✔ импортируем новый KB из engine/
 *   ✔ аккуратно заворачиваем старые функции в новый формат
 *   ✔ оставляем сигнатуру неизменной для старого кода
 */

import { KB } from "../engine/telegram.keyboard.js";

// ======================================================
// 1. Legacy technician keyboard (wrapper around KB)
// ======================================================
export function technicianSelectKeyboard() {
  return KB.technicians();
}

// ======================================================
// 2. Legacy job status keyboard (full custom set)
// ======================================================
export function jobStatusKeyboard(jobId) {
  return {
    inline_keyboard: [
      [{ text: "🟡 In Progress", callback_data: `status_${jobId}_in_progress` }],
      [{ text: "🟢 Completed", callback_data: `status_${jobId}_completed` }],
      [{ text: "🔵 Paid", callback_data: `status_${jobId}_paid` }],
      [{ text: "🟠 Pending", callback_data: `status_${jobId}_pending` }]
    ]
  };
}

// ======================================================
// 3. Legacy after-complete actions
// ======================================================
export function afterCompleteKeyboard(jobId) {
  return {
    inline_keyboard: [
      [{ text: "📸 Upload photos", callback_data: `upload_photos_${jobId}` }],
      [{ text: "🧾 Add parts", callback_data: `add_parts_${jobId}` }],
      [{ text: "📦 Need to order parts", callback_data: `order_parts_${jobId}` }]
    ]
  };
}

// ======================================================
// Extra: export KB so modern modules can import from here
// ======================================================
export { KB };

