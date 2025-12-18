import { google } from "googleapis";
import { GOOGLE_SERVICE } from "../config.js";

const calendar = google.calendar({ version: "v3", auth: GOOGLE_SERVICE });

export async function addGuestToEvent(eventId, email) {
  return await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId,
    requestBody: {
      attendees: [
        { email, responseStatus: "accepted" }
      ]
    },
    sendUpdates: "none"
  });
}

export async function removeAllGuests(eventId) {
  return await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId,
    requestBody: { attendees: [] },
    sendUpdates: "none"
  });
}

