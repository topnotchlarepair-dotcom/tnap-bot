// src/index.js

import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const app = express();
app.use(express.json());

// ======================================================
// CONFIG
// ======================================================
const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const REDIS_URL = process.env.REDIS_URL;
const SERVER_PORT = process.env.PORT || 8080;

// DISPATCH CHAT
const DISPATCH_CHAT_ID = -1003362682354;

// TECH GROUPS
const TECH_CHATS = {
  Danil: -1003494289706
};

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is not set");
  process.exit(1);
}

if (!REDIS_URL) {
  console.error("❌ REDIS_URL is not set");
  process.exit(1);
}

// ======================================================
// REDIS + QUEUE
// ======================================================
const redis = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null
});

const telegramQueue = new Queue("telegram-timers", {
  connection: redis
});

// ======================================================
// HEALTH
// ======================================================
app.get("/", (_, res) => res.send("TNAP BOT OK"));

// ======================================================
// TELEGRAM WEBHOOK
// ======================================================
app.post("/api/telegram", async (req, res) => {
  const update = req.body;

  if (!update.message && !update.callback_query) {
    return res.json({ ok: true });
  }

  try {
    // /jobtest
    if (
      update.message &&
      update.message.chat.id === DISPATCH_CHAT_ID &&
      update.message.text?.startsWith("/jobtest")
    ) {
      await sendJobCard(DISPATCH_CHAT_ID);
      return res.json({ ok: true });
    }

    // CALLBACKS
    if (update.callback_query) {
      const { id, data, message } = update.callback_query;

      await answerCallback(id);

      // ASSIGN TECH
      if (data.startsWith("assign:")) {
        const [, jobId, tech] = data.split(":");

        await updateAssignedCard(message, tech);
        await forwardToTechnician(message, tech, jobId);
        await upsertCalendarEvent(jobId, tech);
      }

      // ON THE WAY
      if (data.startsWith("tech_on_the_way:")) {
        const [, jobId] = data.split(":");

        await tg("editMessageCaption", {
          chat_id: message.chat.id,
          message_id: message.message_id,
          caption: message.caption + `\n\n🚗 Status: On the way`,
          parse_mode: "Markdown"
        });

        await telegramQueue.add(
          "SHOW_COMPLETE_BUTTONS",
          {
            chatId: message.chat.id,
            messageId: message.message_id,
            jobId
          },
          {
            delay: 5 * 60 * 1000, // 5 MIN TEST
            jobId: `show-complete-${jobId}`
          }
        );
      }
    }
  } catch (e) {
    console.error("❌ Telegram handler error:", e);
  }

  return res.json({ ok: true });
});

// ======================================================
// DISPATCH CARD
// ======================================================
async function sendJobCard(chatId) {
  const jobId = 1241;
  const address = "55412 Gipsy Ave, Las Vegas, NV 89107";
  const encoded = encodeURIComponent(address);

  const caption = `
🆕 *NEW JOB REQUEST*
Job #${jobId}     Assigned: —

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
        { text: "Danil", callback_data: `assign:${jobId}:Danil` }
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

// ======================================================
// UPDATE DISPATCH CARD
// ======================================================
async function updateAssignedCard(message, tech) {
  await tg("editMessageCaption", {
    chat_id: message.chat.id,
    message_id: message.message_id,
    caption: message.caption.replace("Assigned: —", `Assigned: ${tech}`),
    parse_mode: "Markdown"
  });
}

// ======================================================
// FORWARD → TECH GROUP
// ======================================================
async function forwardToTechnician(message, tech, jobId) {
  const chatId = TECH_CHATS[tech];

  const keyboard = {
    inline_keyboard: [
      [{ text: "🚗 On the way", callback_data: `tech_on_the_way:${jobId}` }]
    ]
  };

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: message.photo.at(-1).file_id,
    caption: message.caption,
    parse_mode: "Markdown",
    reply_markup: keyboard
  });
}

// ======================================================
// WORKER — TIMER
// ======================================================
new Worker(
  "telegram-timers",
  async job => {
    if (job.name !== "SHOW_COMPLETE_BUTTONS") return;

    const { chatId, messageId, jobId } = job.data;

    await tg("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Job Completed", callback_data: `job_completed:${jobId}` }],
          [{ text: "🔁 Second Visit Required", callback_data: `second_visit:${jobId}` }]
        ]
      }
    });
  },
  { connection: redis }
);

// ======================================================
// STUB
// ======================================================
async function upsertCalendarEvent(jobId, tech) {
  console.log(`📅 Calendar update → job ${jobId},

