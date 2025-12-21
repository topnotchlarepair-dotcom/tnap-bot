/**
 * FSM v1.2 — Telegram Dispatch System
 * Scope: Job Execution ONLY (no payments)
 * Status: HOTFIX — direct technician delivery
 */

import { acquireLock, releaseLock } from "../utils/lock.js";
import { updateJobState, getJobById } from "../storage/jobs.js";
import { renderJobCard } from "./renderer.js";
import {
  addCalendarGuest,
  removeCalendarGuest,
  rescheduleCalendarEvent,
  cancelCalendarEvent
} from "../services/calendar.js";
import {
  updateTelegramMessage,
  telegramSendMessage
} from "../services/telegram.js";

/* ===================== STATES ===================== */
export const STATES = {
  NEW_JOB: "NEW_JOB",
  ASSIGNED: "ASSIGNED",
  JOB_IN_PROGRESS: "JOB_IN_PROGRESS",
  CLOSED_COMPLETED: "CLOSED_COMPLETED",
  CLOSED_FOLLOW_UP: "CLOSED_FOLLOW_UP",
  CLOSED_CANCELED: "CLOSED_CANCELED"
};

/* ===================== EVENTS ===================== */
export const EVENTS = {
  DISPATCH_ASSIGN_TECH: "DISPATCH_ASSIGN_TECH",
  TECH_ON_THE_WAY: "TECH_ON_THE_WAY",
  TECH_COMPLETE_JOB: "TECH_COMPLETE_JOB",
  TECH_SCHEDULE_FOLLOW_UP: "TECH_SCHEDULE_FOLLOW_UP"
};

/* ===================== FSM ===================== */
export async function processFSMEvent({ jobId, event, role, payload = {} }) {
  const lockKey = `fsm:${jobId}`;
  if (!(await acquireLock(lockKey))) return;

  try {
    const job = await getJobById(jobId);
    if (!job) return;

    switch (event) {
      case EVENTS.DISPATCH_ASSIGN_TECH:
        await assignTech(job, payload.tech);
        break;

      case EVENTS.TECH_ON_THE_WAY:
        await onTheWay(job);
        break;

      case EVENTS.TECH_COMPLETE_JOB:
        await completeJob(job, payload);
        break;

      case EVENTS.TECH_SCHEDULE_FOLLOW_UP:
        await followUp(job, payload);
        break;
    }
  } finally {
    await releaseLock(lockKey);
  }
}

/* ===================== ACTIONS ===================== */
async function assignTech(job, tech) {
  if (!tech?.telegramChatId) {
    console.error("❌ Technician has no telegramChatId", tech);
    return;
  }

  await updateJobState(job.jobId, STATES.ASSIGNED, {
    assignedTech: tech
  });

  await addCalendarGuest(job.calendarEventId, tech.email);

  // 🔥 SEND CARD TO TECHNICIAN (NEW MESSAGE)
  const techCard = renderJobCard({
    ...job,
    state: STATES.ASSIGNED,
    assignedTech: tech
  });

  await telegramSendMessage(
    tech.telegramChatId,
    techCard.text,
    techCard.keyboard
  );

  // UPDATE DISPATCHER MESSAGE (SAME MESSAGE)
  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    techCard
  );
}

async function onTheWay(job) {
  await updateJobState(job.jobId, STATES.JOB_IN_PROGRESS);

  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    renderJobCard({ ...job, state: STATES.JOB_IN_PROGRESS })
  );
}

async function completeJob(job, payload) {
  await updateJobState(job.jobId, STATES.CLOSED_COMPLETED, payload);

  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    renderJobCard({ ...job, state: STATES.CLOSED_COMPLETED })
  );
}

async function followUp(job, payload) {
  await updateJobState(job.jobId, STATES.CLOSED_FOLLOW_UP, payload);

  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    renderJobCard({ ...job, state: STATES.CLOSED_FOLLOW_UP })
  );
}

