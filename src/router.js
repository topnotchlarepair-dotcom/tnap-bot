// FILE: src/router.js

import express from "express";
import { handleTelegramWebhook } from "./controllers/telegram.controller.js";
import { handleCalendarWebhook } from "./controllers/calendar.controller.js";
import { handleHcpWebhook } from "./controllers/hcp.controller.js";

const router = express.Router();

// ======================================================
// HEALTH CHECK — Cloud Run мониторит этот маршрут
// ======================================================
router.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "TNAP Bot API Root — running",
  });
});


// ======================================================
// TELEGRAM WEBHOOK — критично: handler сам отправляет ответ
// ======================================================
router.post("/telegram", handleTelegramWebhook);


// ======================================================
// GOOGLE CALENDAR WEBHOOK (Apps Script → Cloud Run)
// ======================================================
router.post("/calendar", handleCalendarWebhook);


// ======================================================
// HOUSECALL PRO (HCP) WEBHOOK
// ======================================================
router.post("/hcp", handleHcpWebhook);


export default router;

