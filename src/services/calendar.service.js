import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const calendar = google.calendar("v3");

/**
 * AUTH — Google Service Account JWT
 */
function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/calendar"]
  );
}

/**
 * Fetch event by ID
 */
export async function getEvent(calendarId, eventId) {
  try {
    const auth = getAuth();

    const res = await calendar.events.get({
      auth,
      calendarId,
      eventId
    });

    return res.data;
  } catch (err) {
    console.error("❌ getEvent ERROR:", err.message);
    return null;
  }
}

/**
 * Add guest email to event
 */
export async function addGuestToCalendar(eventId, guestEmail) {
  try {
    const calendarId = process.env.MASTER_CALENDAR_ID;
    const auth = getAuth();

    // 1) Load event
    const event = await getEvent(calendarId, eventId);
    if (!event) {
      console.error("❌ No event found for ID:", eventId);
      return;
    }

    // 2) Prepare attendees
    const attendees = event.attendees || [];
    attendees.push({ email: guestEmail });

    // 3) Update event
    const updated = await calendar.events.patch({
      auth,
      calendarId,
      eventId,
      requestBody: { attendees }
    });

    console.log("✅ Guest added:", guestEmail);
    return updated.data;
  } catch (err) {
    console.error("❌ addGuestToCalendar ERROR:", err.message);
  }
}

/**
 * Remove ALL guests (reset)
 */
export async function removeGuestFromCalendar(eventId) {
  try {
    const calendarId = process.env.MASTER_CALENDAR_ID;
    const auth = getAuth();

    const event = await getEvent(calendarId, eventId);
    if (!event) return;

    const updated = await calendar.events.patch({
      auth,
      calendarId,
      eventId,
      requestBody: { attendees: [] }
    });

    console.log("🗑️ All guests removed from event:", eventId);
    return updated.data;
  } catch (err) {
    console.error("❌ removeGuestFromCalendar ERROR:", err.message);
  }
}

