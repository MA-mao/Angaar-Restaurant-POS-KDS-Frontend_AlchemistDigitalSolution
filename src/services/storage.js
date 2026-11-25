// The ONLY file that touches localStorage. Components must never import this directly.
import { ServiceError } from "./errors";

export const KEYS = {
  menu: "menu",
  orders: "orders",
  tables: "tables",
  session: "session",
  settings: "settings",
  orderCounter: "orderCounter",
};

const PREFIX = "angaar:v1:";

// Simulated network delay so loading states work now. Set to 0 to disable.
export const LATENCY_MS = 60;
export const latency = (ms = LATENCY_MS) =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

const hasStorage = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

/* ---------- Cross-view / cross-tab sync ---------- */
const listeners = new Set();
let storageBound = false;

function notify(key) {
  listeners.forEach((l) => l(key));
}

function bindStorageEvent() {
  if (storageBound || !hasStorage()) return;
  storageBound = true;
  // Fires in OTHER tabs when localStorage changes (e.g. the KDS tab marks an order Ready).
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith(PREFIX)) notify(e.key.slice(PREFIX.length));
  });
}

// Re-run a fetch whenever one of these keys changes (same tab or another tab).
// Returns an unsubscribe function, so it fits straight into useEffect.
export function subscribe(keys, callback) {
  bindStorageEvent();
  const listener = (k) => {
    if (keys.includes(k)) callback();
  };
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ---------- Raw read / write ---------- */
export function read(key, fallback) {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(key, value, opts = {}) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    throw new ServiceError("STORAGE", "Could not save data (browser storage is full or blocked).");
  }
  if (!opts.silent) notify(key);
}

export function remove(key) {
  if (!hasStorage()) return;
  window.localStorage.removeItem(PREFIX + key);
  notify(key);
}

// Reads a collection, seeding it on first use. Always returns a fresh copy.
export function readOrSeed(key, seed) {
  const existing = read(key, null);
  if (existing !== null) return existing;
  const copy = JSON.parse(JSON.stringify(seed));
  write(key, copy, { silent: true });
  return copy;
}

/* ---------- Helpers ---------- */
export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function nextOrderNumber() {
  const next = read(KEYS.orderCounter, 1000) + 1;
  write(KEYS.orderCounter, next, { silent: true });
  return next;
}

// Wipes menu/orders/tables/settings (keeps the login session). Used by "Reset demo data".
export function resetDemoData() {
  Object.values(KEYS)
    .filter((k) => k !== KEYS.session)
    .forEach((k) => remove(k));
}
