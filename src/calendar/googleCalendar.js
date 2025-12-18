import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * Google Calendar → Cloud Run Webhook Handler
 * Receives payloads from Apps Script
 */
router.post("/", async (req, res) => {
  try {
    console.log("📅 Incoming Calendar Webhook:", JSON.stringify(req.body));

    const event = req.body || {};

    if (!event || !event.action) {
      console.log("⚠️ Calendar webhook received without action");
      return res.status(200).json({ ok: true });
    }

    switch (event.action) {
      case "new_event":
        await handleNewCalendarEvent(event.data);
        break;

      case "update_event":
        await handleUpdatedCalendarEvent(event.data);
        break;

      case "delete_event":
        await handleDeletedCalendarEvent(event.data);
        break;

      default:
        console.log("⚠️ Unknown action:", event.action);
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("❌ Calendar Webhook Error:", error);
    return res.status(500).json({ ok: false });
  }
});

/**
 * HANDLERS
 */
async function handleNewCalendarEvent(data) {
  console.log("📌 Handling NEW calendar event:", data);
  return true;
}

async function handleUpdatedCalendarEvent(data) {
  console.log("♻️ Handling UPDATED calendar event:", data);
  return true;
}

async function handleDeletedCalendarEvent(data) {
  console.log("🗑 Handling DELETED calendar event:", data);
  return true;
}

export default router;

