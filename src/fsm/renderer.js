/**
 * renderer.js
 * Renders Telegram Job Card based on FSM v1.1
 * Single source of truth for UI (text + buttons)
 */

import { STATES } from "./telegram.fsm.js";

/**
 * renderJobCard
 * @param {Object} job
 * @returns {Object} { text, keyboard }
 */
export function renderJobCard(job) {
  const lines = [];
  const buttons = [];

  // ===== HEADER =====
  lines.push(`🧾 Job ID: ${job.jobId}`);
  lines.push(`📍 Address: ${job.address || "—"}`);
  lines.push(`🕒 Scheduled: ${job.scheduledAt || "—"}`);

  // ===== ASSIGNMENT =====
  if (job.assignedTech) {
    lines.push(`🧑‍🔧 Assigned to: ${job.assignedTech.name}`);
  } else {
    lines.push(`🧑‍🔧 Assigned to: —`);
  }

  // ===== STATUS =====
  lines.push(`📌 Status: ${job.state}`);

  // ===== STATE-SPECIFIC UI =====
  switch (job.state) {
    case STATES.NEW_JOB:
      renderAssignButtons(job, buttons);
      break;

    case STATES.ASSIGNED:
      renderTechnicianOnTheWay(job, buttons);
      renderDispatcherControls(job, buttons);
      break;

    case STATES.JOB_IN_PROGRESS:
      renderDispatcherControls(job, buttons);
      if (job.completionUnlocked) {
        renderCompletionButtons(job, buttons);
      } else {
        lines.push(`⏳ Waiting before completion actions…`);
      }
      break;

    case STATES.CLOSED_COMPLETED:
      lines.push(`✅ Job completed`);
      break;

    case STATES.CLOSED_FOLLOW_UP:
      lines.push(`🔁 Follow-up required`);
      break;

    case STATES.CLOSED_CANCELED:
      lines.push(`❌ Job canceled`);
      if (job.reason) {
        lines.push(`📝 Reason: ${job.reason}`);
      }
      break;
  }

  return {
    text: lines.join("\n"),
    keyboard: buttons.length ? buildKeyboard(buttons) : null
  };
}

/* ======================================================
   BUTTON BUILDERS
====================================================== */

function renderAssignButtons(job, buttons) {
  (job.availableTechs || []).forEach(tech => {
    buttons.push([
      {
        text: `🧑‍🔧 ${tech.name}`,
        callback_data: JSON.stringify({
          event: "DISPATCH_ASSIGN_TECH",
          jobId: job.jobId,
          techId: tech.id
        })
      }
    ]);
  });
}

function renderTechnicianOnTheWay(job, buttons) {
  buttons.push([
    {
      text: "🚗 On the Way",
      callback_data: JSON.stringify({
        event: "TECH_ON_THE_WAY",
        jobId: job.jobId
      })
    }
  ]);
}

function renderCompletionButtons(job, buttons) {
  buttons.push([
    {
      text: "✅ Complete Job",
      callback_data: JSON.stringify({
        event: "TECH_COMPLETE_JOB",
        jobId: job.jobId
      })
    }
  ]);
  buttons.push([
    {
      text: "🔁 Schedule Follow-Up",
      callback_data: JSON.stringify({
        event: "TECH_SCHEDULE_FOLLOW_UP",
        jobId: job.jobId
      })
    }
  ]);
}

function renderDispatcherControls(job, buttons) {
  buttons.push([
    {
      text: "🔄 Reassign",
      callback_data: JSON.stringify({
        event: "DISPATCH_REASSIGN",
        jobId: job.jobId
      })
    },
    {
      text: "🕒 Reschedule",
      callback_data: JSON.stringify({
        event: "DISPATCH_RESCHEDULE",
        jobId: job.jobId
      })
    }
  ]);

  buttons.push([
    {
      text: "❌ Cancel",
      callback_data: JSON.stringify({
        event: "DISPATCH_CANCEL",
        jobId: job.jobId
      })
    }
  ]);
}

function buildKeyboard(buttons) {
  return {
    inline_keyboard: buttons
  };
}

