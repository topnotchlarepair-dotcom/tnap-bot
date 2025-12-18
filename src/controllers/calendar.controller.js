import { tgSendMessage } from "../telegram/core.js";
import { DISPATCH_CHAT } from "../config.js";

export async function handleCalendarWebhook(req, res) {
  try {
    const data = req.body || {};
    console.log("📩 Calendar Webhook Received:", data);

    // Normalize Google Calendar → JOB format
    const job = {
      id: data.id || "no-id",
      summary: data.summary || "New Job",
      description: data.description || "No description",
      location: data.location || "No address",
      start: data.start || null,
      end: data.end || null
    };

    console.log("🛠 Normalized Calendar Job:", job);

    // Build formatted Telegram job card
    const text = `
<b>🔥 NEW JOB RECEIVED</b>

<b>📌 Name:</b> ${job.summary}
<b>📍 Address:</b> ${job.location}
<b>📝 Problem:</b> ${job.description}

<b>⏰ Time Window:</b>
${formatTime(job.start)} → ${formatTime(job.end)}

<b>ID:</b> ${job.id}
`;

    // Send to Telegram Dispatch Chat
    await tgSendMessage(DISPATCH_CHAT, text);

    res.status(200).json({ ok: true });

  } catch (err) {
    console.error("❌ Calendar Webhook Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

function formatTime(time) {
  if (!time) return "unknown";
  return new Date(time).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

