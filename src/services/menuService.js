// Future REST:
//   GET    /api/menu                    -> getMenu()
//   GET    /api/menu/:id                -> getMenuItem(id)
//   POST   /api/menu                    -> createMenuItem(input)
//   PATCH  /api/menu/:id                -> updateMenuItem(id, patch)
//   PATCH  /api/menu/:id/availability   -> setItemAvailability(id, available)
//   DELETE /api/menu/:id                -> deleteMenuItem(id)
import { SEED_MENU } from "../data/seed";
import { ServiceError } from "./errors";
import { KEYS, latency, readOrSeed, uid, write } from "./storage";

export const CATEGORIES = ["Burgers", "Pizzas", "Drinks", "Desserts", "Deals"];

// Sync helper for other services (no simulated latency).
export function readMenu() {
  return readOrSeed(KEYS.menu, SEED_MENU);
}

function validate(input, partial) {
  const fields = {};
  if (!partial || input.name !== undefined) {
    if (!input.name || !String(input.name).trim()) fields.name = "Item name is required";
  }
  if (!partial || input.category !== undefined) {
    if (!input.category || !CATEGORIES.includes(input.category)) fields.category = "Choose a valid category";
  }
  if (!partial || input.basePrice !== undefined) {
    if (typeof input.basePrice !== "number" || !(input.basePrice > 0)) fields.basePrice = "Price must be greater than 0";
  }
  if (Object.keys(fields).length) throw new ServiceError("VALIDATION", "Invalid menu item", fields);
}

export async function getMenu() {
  await latency();
  return readMenu();
}

export async function getMenuItem(id) {
  await latency();
  const found = readMenu().find((m) => m.id === id);
  if (!found) throw new ServiceError("NOT_FOUND", "Menu item not found");
  return found;
}

export async function createMenuItem(input) {
  await latency();
  validate(input, false);
  const menu = readMenu();
  const created = {
    ...input,
    name: input.name.trim(),
    description: (input.description || "").trim(),
    variants: input.variants || [],
    addOns: input.addOns || [],
    available: input.available !== false,
    id: uid("m"),
  };
  write(KEYS.menu, [...menu, created]);
  return created;
}

export async function updateMenuItem(id, patch) {
  await latency();
  validate(patch, true);
  const menu = readMenu();
  const idx = menu.findIndex((m) => m.id === id);
  if (idx === -1) throw new ServiceError("NOT_FOUND", "Menu item not found");
  const updated = { ...menu[idx], ...patch, id };
  menu[idx] = updated;
  write(KEYS.menu, menu);
  return updated;
}

export async function setItemAvailability(id, available) {
  return updateMenuItem(id, { available });
}

export async function deleteMenuItem(id) {
  await latency();
  const menu = readMenu();
  if (!menu.some((m) => m.id === id)) throw new ServiceError("NOT_FOUND", "Menu item not found");
  write(
    KEYS.menu,
    menu.filter((m) => m.id !== id)
  );
}
