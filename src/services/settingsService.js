// Future REST: GET /api/settings, PATCH /api/settings
import { DEFAULT_SETTINGS } from "../data/seed";
import { ServiceError } from "./errors";
import { KEYS, latency, readOrSeed, write } from "./storage";

// Sync helper for other services (no simulated latency).
export function readSettings() {
  return { ...DEFAULT_SETTINGS, ...readOrSeed(KEYS.settings, DEFAULT_SETTINGS) };
}

export async function getSettings() {
  await latency();
  return readSettings();
}

export async function updateSettings(patch) {
  await latency();
  const next = { ...readSettings(), ...patch };
  const fields = {};

  if (!String(next.restaurantName).trim()) fields.restaurantName = "Restaurant name is required";
  if (!(next.taxRate >= 0 && next.taxRate <= 1)) fields.taxRate = "Tax must be between 0% and 100%";
  if (!(next.deliveryFee >= 0)) fields.deliveryFee = "Delivery fee cannot be negative";
  if (!(next.kdsWarnMinutes > 0)) fields.kdsWarnMinutes = "Amber alert time must be above 0";
  if (!(next.kdsLateMinutes > next.kdsWarnMinutes)) fields.kdsLateMinutes = "Red alert time must be above the amber time";

  if (Object.keys(fields).length) throw new ServiceError("VALIDATION", "Invalid settings", fields);

  write(KEYS.settings, next);
  return next;
}
