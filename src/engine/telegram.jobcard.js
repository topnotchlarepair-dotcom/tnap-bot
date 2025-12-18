// FILE: src/engine/telegram.jobcard.js

/**
 * SUPREME JOB CARD MODULE V7.3
 * ------------------------------------------------------
 * Ultra-clean job card builder with:
 *   ✔ Google Maps link
 *   ✔ Apple Maps link
 *   ✔ Status icons
 *   ✔ Optional StreetView preview
 *   ✔ Uses SUPREME KEYBOARD MODULE (KB)
 */

import { KB } from "./telegram.keyboard.js";
import { getStreetViewUrl } from "../utils/streetview.js";
import { telegramSender } from "./telegram.sender.js";

export class JobCardBuilder {

  // ======================================================
  // BUILD SUPREME CARD
  // ======================================================
  static build(job) {
    const {
      id = "N/A",
      clientName = "Unknown",
      phone = "-",
      address = "-",
      appliance = "-",
      brand = "",
      model = "",
      serial = "",
      description = "",
      visitDate = "",
      timeWindow = "",
      technician = "Unassigned",
      status = "Pending"
    } = job;

    // -----------------------------------------------------
    // STATUS ICONS
    // -----------------------------------------------------
    const statusIcon =
      status === "Completed"      ? "🟢" :
      status === "In Progress"    ? "🟡" :
      status === "Pending"        ? "🟠" :
      status === "Paid"           ? "🔵" :
                                    "⚪";

    // -----------------------------------------------------
    // MAP LINKS
    // -----------------------------------------------------
    const encodedAddress = encodeURIComponent(address);

    const googleMaps = `https://maps.google.com/?q=${encodedAddress}`;
    const appleMaps  = `https://maps.apple.com/?address=${encodedAddress}`;

    // -----------------------------------------------------
    // APPLIANCE DETAILS
    // -----------------------------------------------------
    const applianceDetails =
      model || serial
        ? `
📦 <b>Appliance Details:</b>
${model ? "• Model: <b>" + model + "</b>\n" : ""}
${serial ? "• Serial: <b>" + serial + "</b>" : ""}
`.trim()
        : "";

    // -----------------------------------------------------
    // FINAL FORMATTED CARD
    // -----------------------------------------------------
    return `
${statusIcon} <b>NEW JOB REQUEST</b>
━━━━━━━━━━━━━━━━━━

👤 <b>Client:</b> ${clientName}
📞 <b>Phone:</b> ${phone}
📍 <b>Address:</b> ${address}

🔗 <a href="${googleMaps}">Google Maps</a> | <a href="${appleMaps}">Apple Maps</a>

━━━━━━━━━━━━━━━━━━

🛠 <b>Appliance:</b> ${appliance} ${brand ? "(" + brand + ")" : ""}

${applianceDetails ? "\n" + applianceDetails + "\n\n━━━━━━━━━━━━━━━━━━" : ""}

⚠️ <b>Issue:</b> ${description}

━━━━━━━━━━━━━━━━━━

📅 <b>Date:</b> ${visitDate}
⏰ <b>Window:</b> ${timeWindow}

👨‍🔧 <b>Technician:</b> ${technician}
🏷 <b>Status:</b> ${status}
`.trim();
  }

  // ======================================================
  // SEND CARD + STREETVIEW
  // ======================================================
  static async send(job, chatId, includeStreetView = true) {
    const msg = JobCardBuilder.build(job);

    // 1. StreetView preview (optional)
    if (includeStreetView && job.address) {
      const url = getStreetViewUrl(job.address);
      if (url) {
        await telegramSender.photo(
          chatId,
          url,
          `📍 <b>${job.address}</b>\nStreetView preview`
        );
      }
    }

    // 2. Send main card with technician select keyboard
    await telegramSender.text(
      chatId,
      msg,
      KB.technicians(),   // ← THIS WAS FIXED
      2
    );
  }

  static compact(job) {
    return `#${job.id} | ${job.clientName} | ${job.appliance} | ${job.address}`;
  }
}

export const JobCard = JobCardBuilder;

