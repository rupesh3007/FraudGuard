// ── API client ───────────────────────────────────────────────────────────
// VITE_API_URL points at the deployed FastAPI backend (e.g. Render).
// Locally it falls back to "" so Vite's dev proxy (see vite.config.js)
// forwards /api/* to http://localhost:5000.
const RAW_API_URL = import.meta.env.VITE_API_URL || "";
export const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, "")}/api` : "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(options.headers || {}) },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function checkHealth() {
  return request("/health");
}

export async function fetchDemoResults() {
  return request("/results?session_id=demo");
}

export async function uploadCsv(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    let detail = `Upload failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function analyzeSession(sessionId) {
  return request(`/analyze?session_id=${encodeURIComponent(sessionId)}`, { method: "POST" });
}

export async function fetchResults(sessionId) {
  return request(`/results?session_id=${encodeURIComponent(sessionId)}`);
}

// ── Derived chart data ──────────────────────────────────────────────────
// The backend returns the raw list of flagged rows in `fraud_transactions`.
// These helpers turn that row list into the aggregates the dashboard charts
// need. Field names fall back gracefully across dataset shapes.

const CATEGORY_KEYS = ["merchant_category_label", "merchant_category", "category"];
const DEVICE_KEYS = ["device_label", "device_id", "device", "deviceid"];
const PAYMENT_KEYS = ["payment_method_label", "payment_method", "channel_label", "channel"];
const TIME_KEYS = ["timestamp", "transaction_time", "date", "datetime", "time"];
const AMOUNT_KEYS = ["amount", "transaction_amount", "amt", "value"];

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
  }
  return null;
}

function tally(rows, keys, limit = 7) {
  const counts = new Map();
  for (const row of rows) {
    let val = pick(row, keys);
    if (val === null) continue;
    val = String(val).trim();
    if (!val || val.toLowerCase() === "nan") continue;
    counts.set(val, (counts.get(val) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function hourBuckets(rows) {
  const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  let any = false;
  for (const row of rows) {
    const raw = pick(row, TIME_KEYS);
    if (raw === null) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    buckets[d.getHours()].count += 1;
    any = true;
  }
  return any ? buckets : null;
}

export function deriveBreakdowns(fraudTransactions = []) {
  return {
    byCategory: tally(fraudTransactions, CATEGORY_KEYS),
    byDevice: tally(fraudTransactions, DEVICE_KEYS),
    byPayment: tally(fraudTransactions, PAYMENT_KEYS),
    byHour: hourBuckets(fraudTransactions),
    totalAmountFlagged: fraudTransactions.reduce((sum, row) => {
      const v = Number(pick(row, AMOUNT_KEYS));
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0),
  };
}
