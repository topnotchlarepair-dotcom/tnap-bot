// src/index.js

import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ======================================================
// CONFIG
// ======================================================
const PORT = process.env.PORT || 8080;
const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ✅ DISPATCH CHAT ID (уже подтверждён)
const DISPATCH_CHAT_ID = -1003362682354;

// ❌ ПОКА ЗАГЛУШКИ — МЫ ИХ ЗАМЕНИМ ПОСЛЕ ЛОГОВ
const TECH_CHATS = {
  Danil: -1001111111111,
  Abdulla: -1002222222222,
  Eugene: -1003333333333
};

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is not set");
  process.exit(1);
}

// ======================================================
// HEALTH
// ======================================================
app.get("/", (_, res) => res.send("TNAP BOT OK"));

// ======================================================
// TELEGRAM WEBHOOK
// ======================================================
app.post("/api/telegram", async (req, res) => {
  const update = req.body;

  // ==================================================
  // 🔥 STEP 1 — LOG EVERY CHAT_ID (CRITICAL)
  // ==================================================
  if (update.message?.chat) {
    console.log("📣 INCOMING MESSAGE CHAT");
    console.log({
      chat_id: update.message.chat.id,
      type: update.message.chat.type,
      title: update.message.chat.title || null,
      username: update.message.chat.username || null
    });
  }

  if (update.callback_query?.message?.chat) {
    console.log("📣 INCOMING CALLBACK CHAT");
    console.log({
      chat_id: update.callback_query.message.chat.id,
      type: update.callback_query.message.chat.type,
      title: update.callback_query.message.chat.title || null
    });
  }

  // ==================================================
  // FILTER
  // ==================================================
  if (!update.message && !update.callback_query) {
    return res.json({ ok: true });
  }

  try {
    // ==================================================
    // COMMAND: /jobtest (ONLY DISPATCH CHAT)
    // ==================================================
    if (
      update.message &&
      update.message.chat.id === DISPATCH_CHAT_ID &&
      update.message.text?.startsWith("/jobtest")
    ) {
      await sendJobCard(DISPATCH_CHAT_ID);
      return res.json({ ok: true });
    }

    // ==================================================
    // CALLBACKS
    // ==================================================
    if (update.callback_query) {
      const { id, data, message } = update.callback_query;

      await answerCallback(id);

      if (data.startsWith("assign:")) {
        const [, jobId, tech] = data.split(":");

        console.log(`🧑‍🔧 ASSIGN CLICKED → ${tech}`);

        await updateAssignedCard(message, tech);
        await forwardToTechnician(message, tech);
        await upsertCalendarEvent(jobId, tech);
      }

      if (data.startsWith("reassign:")) {
        await showReassignButtons(message);
      }
    }
  } catch (e) {
    console.error("❌ Telegram handler error:", e);
  }

  return res.json({ ok: true });
});

// ======================================================
// UI FUNCTIONS
// ======================================================
async function sendJobCard(chatId) {
  const jobId = 1241;
  const address = "55412 Gipsy Ave, Las Vegas, NV 89107";
  const encoded = encodeURIComponent(address);

  const caption = `
🔥 *NEW JOB REQUEST*

👤 Client: John Doe
📞 Phone: 310-555-9922

📍 ${address}
🔧 Washer — Not draining
📅 2025-12-10 | 10:00–12:00
`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🗺 Google Maps", url: `https://www.google.com/maps/dir/?api=1&destination=${encoded}` },
        { text: "🍎 Apple Maps", url: `https://maps.apple.com/?daddr=${encoded}` }
      ],
      [
        { text: "Danil", callback_data: `assign:${jobId}:Danil` },
        { text: "Abdulla", callback_data: `assign:${jobId}:Abdulla` },
        { text: "Eugene", callback_data: `assign:${jobId}:Eugene` }
      ]
    ]
  };

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encoded}&key=${GOOGLE_MAPS_API_KEY}`,
    caption,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
}

async function updateAssignedCard(message, tech) {
  await tg("editMessageCaption", {
    chat_id: message.chat.id,
    message_id: message.message_id,
    caption: message.caption + `\n\n🧑‍🔧 *Assigned to:* ${tech}`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "🔁 Change technician", callback_data: `reassign:1241` }]]
    }
  });
}

async function showReassignButtons(message) {
  await tg("editMessageReplyMarkup", {
    chat_id: message.chat.id,
    message_id: message.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Danil", callback_data: `assign:1241:Danil` },
          { text: "Abdulla", callback_data: `assign:1241:Abdulla` },
          { text: "Eugene", callback_data: `assign:1241:Eugene` }
        ]
      ]
    }
  });
}

// ======================================================
// 🚨 TECH FORWARD (НАМ ВАЖЕН ЭТОТ ЛОГ)
// ======================================================
async function forwardToTechnician(message, tech) {
  const chatId = TECH_CHATS[tech];

  console.log("📤 FORWARD TO TECH", { tech, chatId });

  if (!chatId) {
    console.error("❌ TECH CHAT ID NOT FOUND");
    return;
  }

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: message.photo.at(-1).file_id,
    caption: message.caption + "\n\n🧑‍🔧 *Assigned to YOU*",
    parse_mode: "Markdown"
  });
}

// ======================================================
// CALENDAR (stub)
// ======================================================
async function upsertCalendarEvent(jobId, tech) {
  console.log(`📅 Calendar update → job ${jobId}, tech ${tech}`);
}

// ======================================================
// TELEGRAM API
// ======================================================
async function tg(method, payload) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function answerCallback(id) {
  await tg("answerCallbackQuery", { callback_query_id: id });
}

// ======================================================
app.listen(PORT, () =>
  console.log("🚀 TNAP BOT LIVE (PRODUCTION MODE)")
);

