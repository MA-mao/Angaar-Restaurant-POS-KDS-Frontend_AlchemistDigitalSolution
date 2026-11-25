// Future REST:
//   POST /api/auth/login   { username, password } -> login()
//   POST /api/auth/logout                         -> logout()
//   GET  /api/auth/me                             -> getSession()
// DEMO ONLY: passwords live in data/seed.js. Never ship this to production.
import { DEMO_USERS } from "../data/seed";
import { ServiceError } from "./errors";
import { KEYS, latency, read, remove, write } from "./storage";

// Where each role lands after login.
export const ROLE_HOME = {
  cashier: "/pos",
  kitchen: "/kds",
  manager: "/manager",
};

// Which routes each role may open (used by the route guard).
export const ROLE_ACCESS = {
  cashier: ["/pos", "/orders", "/tables"],
  kitchen: ["/kds"],
  manager: ["/manager", "/pos", "/orders", "/tables", "/kds"],
};

const publicUser = (u) => ({ id: u.id, username: u.username, name: u.name, role: u.role });

// Sync read for route guards / initial render (no simulated latency).
export function getSessionSync() {
  return read(KEYS.session, null);
}

export async function getSession() {
  await latency();
  return getSessionSync();
}

export async function login(username, password) {
  await latency();

  const fields = {};
  if (!String(username || "").trim()) fields.username = "Username is required";
  if (!password) fields.password = "Password is required";
  if (Object.keys(fields).length) throw new ServiceError("VALIDATION", "Please fill in both fields", fields);

  const match = DEMO_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );
  if (!match) throw new ServiceError("UNAUTHORIZED", "Invalid username or password");

  const session = { user: publicUser(match), loggedInAt: new Date().toISOString() };
  write(KEYS.session, session);
  return session;
}

export async function logout() {
  await latency();
  remove(KEYS.session);
}

// Role Switcher screen: lets a logged-in demo user hop between the three views.
export async function switchRole(role) {
  await latency();
  const current = getSessionSync();
  if (!current) throw new ServiceError("UNAUTHORIZED", "Please log in first");

  const target = DEMO_USERS.find((u) => u.role === role);
  if (!target) throw new ServiceError("NOT_FOUND", "Unknown role");

  const session = { user: publicUser(target), loggedInAt: current.loggedInAt };
  write(KEYS.session, session);
  return session;
}
