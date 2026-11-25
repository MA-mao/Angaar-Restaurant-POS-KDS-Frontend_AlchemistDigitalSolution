import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { errMsg } from "../lib/format.js";
import { ROLE_HOME } from "../services";

const ROLES = [
  {
    role: "cashier",
    icon: "🧾",
    title: "Cashier / Order Counter",
    text: "POS menu terminal, table assignment, orders and billing.",
  },
  {
    role: "kitchen",
    icon: "👨‍🍳",
    title: "Kitchen Staff (KDS)",
    text: "Live board: New → Preparing → Ready, with running timers.",
  },
  {
    role: "manager",
    icon: "📊",
    title: "Restaurant Manager",
    text: "Menu management, availability toggles and daily sales.",
  },
];

export default function SwitchPage() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  async function go(role) {
    setBusy(role);
    try {
      await switchRole(role);
      navigate(ROLE_HOME[role]);
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-8">
      <h1 className="text-2xl font-extrabold">Switch view</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Signed in as <b>{user?.name}</b>. Pick the screen you want to work on.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {ROLES.map((r) => {
          const current = user?.role === r.role;
          return (
            <button
              key={r.role}
              disabled={busy !== null}
              onClick={() => go(r.role)}
              className={`card p-5 text-left transition hover:border-ember hover:bg-neutral-800 active:scale-[0.98] ${current ? "border-ember" : ""}`}
            >
              <div className="text-4xl">{r.icon}</div>
              <div className="mt-3 text-lg font-bold">{r.title}</div>
              <p className="mt-1 text-sm text-neutral-400">{r.text}</p>
              <div className="mt-3 text-xs font-semibold text-ember">{current ? "● Current view" : busy === r.role ? "Switching…" : "Open →"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
