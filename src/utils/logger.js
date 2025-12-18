// FILE: src/utils/logger.js

/**
 * SUPREME LOGGER V4 (Cloud Run Compatible)
 * ------------------------------------------------------
 * Features:
 *  ✔ Plain text output for textPayload (Cloud Run visible)
 *  ✔ Structured JSON output for jsonPayload
 *  ✔ Auto BigQuery detection
 *  ✔ Local safe fallback
 *  ✔ TraceID support
 *  ✔ Batch BigQuery writer
 */

let BigQuery = null;
let bigquery = null;

// ======================================================
// TRY LOADING BIGQUERY
// ======================================================
try {
  BigQuery = (await import("@google-cloud/bigquery")).BigQuery;
} catch (e) {
  console.warn("⚠️ BigQuery package not found — LOCAL LOGGER MODE enabled.");
}

// ======================================================
// ENABLE / DISABLE BQ
// ======================================================
const bigqueryEnabled =
  BigQuery &&
  process.env.BQ_LOGS_ENABLED === "true" &&
  process.env.BQ_LOGS_DATASET &&
  process.env.BQ_LOGS_TABLE &&
  process.env.GOOGLE_PROJECT_ID;

if (bigqueryEnabled) {
  bigquery = new BigQuery({
    projectId: process.env.GOOGLE_PROJECT_ID,
  });
  console.log("📊 BigQuery logging ENABLED");
} else {
  console.log("📄 Local logging ONLY (BigQuery disabled)");
}

// ======================================================
// TRACE
// ======================================================
export function createTrace() {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ======================================================
// LOG BUILDER
// ======================================================
function buildLog(severity, type, message, payload = null, error = null, trace = null) {
  const entry = {
    severity,
    type,
    message,
    timestamp: new Date().toISOString(),
  };

  if (trace) entry.trace = trace;
  if (payload) entry.payload = payload;

  if (error) {
    entry.error = {
      name: error.name || null,
      message: error.message || String(error),
      stack: error.stack || null,
    };
  }

  return entry;
}

// ======================================================
// BIGQUERY BATCH QUEUE
// ======================================================
let batch = [];
let batchTimer = null;

async function flushBatch() {
  if (!bigqueryEnabled || batch.length === 0) return;

  try {
    await bigquery
      .dataset(process.env.BQ_LOGS_DATASET)
      .table(process.env.BQ_LOGS_TABLE)
      .insert(batch);
  } catch (err) {
    console.error("❌ BQ batch insert error:", err);
  }

  batch = [];
}

function queue(entry) {
  if (!bigqueryEnabled) return;

  batch.push(entry);

  if (!batchTimer) {
    batchTimer = setTimeout(() => {
      flushBatch();
      batchTimer = null;
    }, 3000);
  }
}

// ======================================================
// PUBLIC LOG METHODS (with text + json payload)
// ======================================================
export function logInfo(message, payload = null, trace = null) {
  const entry = buildLog("INFO", "INFO", message, payload, null, trace);

  // 👇 This line is what Cloud Run shows in textPayload
  console.log(`[INFO] ${message}`);

  // 👇 This line goes into jsonPayload (searchable structured logs)
  console.log(JSON.stringify(entry));

  queue(entry);
}

export function logWarn(message, payload = null, trace = null) {
  const entry = buildLog("WARNING", "WARN", message, payload, null, trace);

  console.warn(`[WARN] ${message}`);
  console.warn(JSON.stringify(entry));

  queue(entry);
}

export function logError(message, err = null, payload = null, trace = null) {
  const entry = buildLog("ERROR", "ERROR", message, payload, err, trace);

  console.error(`[ERROR] ${message}`);
  console.error(JSON.stringify(entry));

  queue(entry);
}

export function logDebug(message, payload = null, trace = null) {
  if (process.env.NODE_ENV !== "production") {
    const entry = buildLog("DEBUG", "DEBUG", message, payload, null, trace);

    console.log(`[DEBUG] ${message}`);
    console.log(JSON.stringify(entry));
  }
}

// ======================================================
// ADVANCED LOGGING
// ======================================================
export function logEvent(eventName, payload = null, trace = null) {
  const entry = buildLog("INFO", "EVENT", eventName, payload, null, trace);
  console.log(`[EVENT] ${eventName}`);
  console.log(JSON.stringify(entry));
  queue(entry);
}

export function logAudit(action, payload = null, user = null, trace = null) {
  const entry = buildLog("NOTICE", "AUDIT", action, { user, ...payload }, null, trace);
  console.log(`[AUDIT] ${action}`);
  console.log(JSON.stringify(entry));
  queue(entry);
}

export function logMetric(name, value = 1, labels = {}, trace = null) {
  const entry = buildLog("INFO", "METRIC", name, { value, labels }, null, trace);
  console.log(`[METRIC] ${name}`);
  console.log(JSON.stringify(entry));
  queue(entry);
}

export function logSecurity(message, payload = null, trace = null) {
  const entry = buildLog("WARNING", "SECURITY", message, payload, null, trace);
  console.warn(`[SECURITY] ${message}`);
  console.warn(JSON.stringify(entry));
  queue(entry);
}

export function logIncoming(source, payload = null, trace = null) {
  const entry = buildLog("INFO", "INCOMING", `Incoming from ${source}`, payload, null, trace);
  console.log(`[INCOMING] from ${source}`);
  console.log(JSON.stringify(entry));
  queue(entry);
}

export function logOutgoing(target, payload = null, trace = null) {
  const entry = buildLog("INFO", "OUTGOING", `Outgoing to ${target}`, payload, null, trace);
  console.log(`[OUTGOING] to ${target}`);
  console.log(JSON.stringify(entry));
  queue(entry);
}

// ======================================================
// TIMING LOGGER
// ======================================================
export function startTimer() {
  return Date.now();
}

export function logTiming(label, startTime, trace = null) {
  const duration = Date.now() - startTime;
  const entry = buildLog("INFO", "TIMING", label, { duration_ms: duration }, null, trace);

  console.log(`[TIMING] ${label}: ${duration}ms`);
  console.log(JSON.stringify(entry));

  queue(entry);
}

