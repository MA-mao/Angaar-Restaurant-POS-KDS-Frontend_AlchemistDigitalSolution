// Future REST:
//   GET   /api/tables                   -> getTables()
//   POST  /api/tables/:id/request-bill  -> requestBill(tableId)
// assignOrderToTable / releaseTable / markBillingPending are used by orderService
// (on a real backend these happen automatically inside the order endpoints).
import { SEED_TABLES } from "../data/seed";
import { ServiceError } from "./errors";
import { KEYS, latency, readOrSeed, write } from "./storage";

export function readTables() {
  return readOrSeed(KEYS.tables, SEED_TABLES);
}

function patchTable(tableId, patch) {
  const tables = readTables();
  const idx = tables.findIndex((t) => t.id === tableId);
  if (idx === -1) throw new ServiceError("NOT_FOUND", "Table not found");
  tables[idx] = { ...tables[idx], ...patch };
  write(KEYS.tables, tables);
  return tables[idx];
}

export async function getTables() {
  await latency();
  return readTables();
}

export function assignOrderToTable(tableId, orderId) {
  return patchTable(tableId, { status: "occupied", currentOrderId: orderId });
}

export function markBillingPending(tableId) {
  return patchTable(tableId, { status: "billing_pending" });
}

export function releaseTable(tableId) {
  return patchTable(tableId, { status: "available", currentOrderId: null });
}

// Cashier asks for the bill (customer waves for it) before the kitchen marks "served".
export async function requestBill(tableId) {
  await latency();
  const table = readTables().find((t) => t.id === tableId);
  if (!table) throw new ServiceError("NOT_FOUND", "Table not found");
  if (table.status !== "occupied") {
    throw new ServiceError("INVALID_STATE", "Only an occupied table can move to billing");
  }
  return markBillingPending(tableId);
}
