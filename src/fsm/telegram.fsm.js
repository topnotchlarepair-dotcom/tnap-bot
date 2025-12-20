/**
 * FSM v1.1 — Telegram Dispatch System
 * Scope: Job Execution ONLY (no payments)
 * Status: APPROVED
 */

import { acquireLock, releaseLock } from "../utils/lock.js";
import { updateJobState, getJobById } from "../storage/jobs.js";
import { renderJobCard } from "./renderer.js";
import {
  notifyClient,
  notifyTechnician
} from "../services/notifications.js";
import {
  addCalendarGuest,
  removeCalendarGuest,
  rescheduleCalendarEvent,
  cancelCalendarEvent
} from "../services/calendar.js";
import { updateTelegramMessage } from "../services/telegram.js";

/* ======================================================
   FSM STATES
====================================================== */
export const STATES = {
  IDLE: "IDLE",
  NEW_JOB: "NEW_JOB",
  ASSIGNED: "ASSIGNED",
  JOB_IN_PROGRESS: "JOB_IN_PROGRESS",
  COMPLETE_JOB_FLOW: "COMPLETE_JOB_FLOW",
  FOLLOW_UP_FLOW: "FOLLOW_UP_FLOW",
  CLOSED_COMPLETED: "CLOSED_COMPLETED",
  CLOSED_FOLLOW_UP: "CLOSED_FOLLOW_UP",
  CLOSED_CANCELED: "CLOSED_CANCELED"
};

/* ======================================================
   EVENTS
====================================================== */
export const EVENTS = {
  DISPATCH_ASSIGN_TECH: "DISPATCH_ASSIGN_TECH",
  DISPATCH_REASSIGN: "DISPATCH_REASSIGN",
  DISPATCH_RESCHEDULE: "DISPATCH_RESCHEDULE",
  DISPATCH_CANCEL: "DISPATCH_CANCEL",
  DISPATCH_FORCE_IN_PROGRESS: "DISPATCH_FORCE_IN_PROGRESS",

  TECH_ON_THE_WAY: "TECH_ON_THE_WAY",
  TECH_COMPLETE_JOB: "TECH_COMPLETE_JOB",
  TECH_SCHEDULE_FOLLOW_UP: "TECH_SCHEDULE_FOLLOW_UP",

  SYSTEM_TIMER_30MIN: "SYSTEM_TIMER_30MIN"
};

/* ======================================================
   GUARDS
====================================================== */
function canExecute(event, role, state) {
  const rules = {
    DISPATCH_ASSIGN_TECH: role === "DISPATCHER" && state === STATES.NEW_JOB,
    DISPATCH_REASSIGN:
      role === "DISPATCHER" &&
      [STATES.ASSIGNED, STATES.JOB_IN_PROGRESS].includes(state),
    DISPATCH_RESCHEDULE:
      role === "DISPATCHER" &&
      [STATES.ASSIGNED, STATES.JOB_IN_PROGRESS].includes(state),
    DISPATCH_CANCEL:
      role === "DISPATCHER" &&
      [STATES.ASSIGNED, STATES.JOB_IN_PROGRESS].includes(state),
    DISPATCH_FORCE_IN_PROGRESS:
      role === "DISPATCHER" && state === STATES.JOB_IN_PROGRESS,

    TECH_ON_THE_WAY: role === "TECHNICIAN" && state === STATES.ASSIGNED,
    TECH_COMPLETE_JOB:
      role === "TECHNICIAN" && state === STATES.JOB_IN_PROGRESS,
    TECH_SCHEDULE_FOLLOW_UP:
      role === "TECHNICIAN" && state === STATES.JOB_IN_PROGRESS
  };

  return Boolean(rules[event]);
}

/* ======================================================
   FSM REDUCER
====================================================== */
export async function processFSMEvent({
  jobId,
  event,
  role,
  payload = {}
}) {
  const lockKey = `fsm:${jobId}`;
  if (!(await acquireLock(lockKey))) return;

  try {
    const job = await getJobById(jobId);
    if (!job) return;

    if (!canExecute(event, role, job.state)) return;

    switch (event) {
      case EVENTS.DISPATCH_ASSIGN_TECH:
        await assignTech(job, payload.tech);
        break;

      case EVENTS.DISPATCH_REASSIGN:
        await reassignTech(job, payload.tech);
        break;

      case EVENTS.DISPATCH_RESCHEDULE:
        await reschedule(job, payload.newTime);
        break;

      case EVENTS.DISPATCH_CANCEL:
        await cancelJob(job, payload.reason);
        break;

      case EVENTS.TECH_ON_THE_WAY:
        await onTheWay(job);
        break;

      case EVENTS.SYSTEM_TIMER_30MIN:
        await unlockCompletion(job);
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

/* ======================================================
   ACTIONS
====================================================== */
async function assignTech(job, tech) {
  await updateJobState(job.jobId, STATES.ASSIGNED, {
    assignedTech: tech
  });

  await addCalendarGuest(job.calendarEventId, tech.email);
  await notifyTechnician(tech, "assigned", job);

  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    renderJobCard({ ...job, state: STATES.ASSIGNED, assignedTech: tech })
  );
}

async function reassignTech(job, newTech) {
  if (job.assignedTech) {
    await removeCalendarGuest(job.calendarEventId, job.assignedTech.email);
    await notifyTechnician(job.assignedTech, "reassigned_off", job);
  }

  await addCalendarGuest(job.calendarEventId, newTech.email);
  await notifyTechnician(newTech, "reassigned_on", job);

  await updateJobState(job.jobId, job.state, {
    assignedTech: newTech
  });

  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    renderJobCard({ ...job, assignedTech: newTech })
  );
}

async function reschedule(job, newTime) {
  await rescheduleCalendarEvent(job.calendarEventId, newTime);
  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    renderJobCard(job)
  );
}

async function cancelJob(job, reason) {
  await cancelCalendarEvent(job.calendarEventId, reason);
  await updateJobState(job.jobId, STATES.CLOSED_CANCELED, { reason });

  await notifyTechnician(job.assignedTech, "canceled", job);
  await notifyClient(job.clientId, "canceled", job);

  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    renderJobCard({ ...job, state: STATES.CLOSED_CANCELED })
  );
}

async function onTheWay(job) {
  await updateJobState(job.jobId, STATES.JOB_IN_PROGRESS);

  await notifyClient(job.clientId, "on_the_way", job);

  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    renderJobCard({ ...job, state: STATES.JOB_IN_PROGRESS })
  );
}

async function unlockCompletion(job) {
  await updateTelegramMessage(
    job.chatId,
    job.messageId,
    renderJobCard({ ...job, completionUnlocked: true })
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

