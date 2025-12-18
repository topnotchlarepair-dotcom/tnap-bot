// FILE: src/engine/telegram.keyboard.js

export class KeyboardFactory {

  static technicians(list = []) {
    if (!Array.isArray(list) || list.length === 0) {
      list = ["Daniel", "Abdulla", "Evgenii"];
    }

    const rows = list.map(name => ([
      { text: `👨‍🔧 ${name}`, callback_data: `assign_${name}` }
    ]));

    return { inline_keyboard: rows };
  }

  static status(jobId) {
    return {
      inline_keyboard: [
        [{ text: "🟡 In Progress", callback_data: `status_${jobId}_in_progress` }],
        [{ text: "🟢 Completed", callback_data: `status_${jobId}_completed` }],
        [{ text: "🔵 Paid", callback_data: `status_${jobId}_paid` }],
        [{ text: "🟠 Pending", callback_data: `status_${jobId}_pending` }]
      ]
    };
  }

  static parts(jobId) {
    return {
      inline_keyboard: [
        [{ text: "📦 Add Parts", callback_data: `parts_${jobId}_add` }],
        [{ text: "🛒 Order Parts", callback_data: `parts_${jobId}_order` }]
      ]
    };
  }

  static complete(jobId) {
    return {
      inline_keyboard: [
        [{ text: "✔ Job Completed", callback_data: `complete_${jobId}` }],
        [{ text: "❌ Job Not Completed", callback_data: `notcomplete_${jobId}` }]
      ]
    };
  }

  static navigation(address) {
    const encoded = encodeURIComponent(address);
    return {
      inline_keyboard: [
        [{ text: "🌍 Google Maps", url: `https://maps.google.com/?q=${encoded}` }],
        [{ text: "🍏 Apple Maps", url: `https://maps.apple.com/?address=${encoded}` }]
      ]
    };
  }

  static photos(jobId) {
    return {
      inline_keyboard: [
        [{ text: "📸 Upload Photos", callback_data: `photos_${jobId}` }]
      ]
    };
  }

  static merge(...keyboards) {
    const result = { inline_keyboard: [] };
    keyboards.forEach(kb => {
      if (kb?.inline_keyboard) result.inline_keyboard.push(...kb.inline_keyboard);
    });
    return result;
  }
}

// 🔥 Главное! Экспорт, который Cloud Run не видит:
export const KB = KeyboardFactory;

