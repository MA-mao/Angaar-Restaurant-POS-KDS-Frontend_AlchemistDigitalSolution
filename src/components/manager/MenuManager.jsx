import { useState } from "react";
import ItemFormModal from "./ItemFormModal.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useLive } from "../../lib/hooks.js";
import { errMsg, money } from "../../lib/format.js";
import { CATEGORIES, deleteMenuItem, getMenu, setItemAvailability } from "../../services";

function Switch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald-500" : "bg-neutral-600"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export default function MenuManager({ currency = "Rs." }) {
  const toast = useToast();
  const { data: menu, loading } = useLive(getMenu, ["menu"]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit

  const rows = (menu || [])
    .filter((m) => category === "All" || m.category === category)
    .filter((m) => m.name.toLowerCase().includes(search.trim().toLowerCase()));

  async function toggle(item, available) {
    try {
      await setItemAvailability(item.id, available);
      toast(`${item.name} is now ${available ? "available" : "sold out"}`, "success");
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${item.name}" from the menu?`)) return;
    try {
      await deleteMenuItem(item.id);
      toast("Item deleted", "success");
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold">Menu management</h2>
        <button className="btn btn-primary" onClick={() => setEditing(null)}>
          + Add item
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search menu…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search menu items" />
        <div className="flex flex-wrap gap-1">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${category === c ? "bg-ember text-white" : "bg-white/5 text-neutral-300 hover:bg-white/10"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading menu…</p>
      ) : rows.length === 0 ? (
        <p className="card p-6 text-center text-sm text-neutral-500">No items match.</p>
      ) : (
        <ul className="card divide-y divide-white/10">
          {rows.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="text-2xl">{m.emoji || "🍽"}</span>
              <div className="min-w-[10rem] flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-neutral-500">
                  {m.category} · {m.variants.length} variants · {m.addOns.length} add-ons
                </div>
              </div>
              <div className="w-24 text-right font-semibold">{money(m.basePrice, currency)}</div>
              <div className="flex items-center gap-2">
                <Switch on={m.available} onChange={(v) => toggle(m, v)} label={`Toggle ${m.name} availability`} />
                <span className={`w-16 text-xs ${m.available ? "text-emerald-400" : "text-neutral-500"}`}>{m.available ? "Available" : "Sold out"}</span>
              </div>
              <div className="flex gap-1">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(m)}>
                  Edit
                </button>
                <button className="btn btn-ghost btn-sm text-red-400" onClick={() => remove(m)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== undefined && <ItemFormModal item={editing} onClose={() => setEditing(undefined)} />}
    </section>
  );
}
