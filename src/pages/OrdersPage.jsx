import { useState } from "react";
import Modal from "../components/ui/Modal.jsx";
import { PayBadge, StatusBadge, TypeBadge } from "../components/ui/Badges.jsx";
import OrderPanel from "../components/orders/OrderPanel.jsx";
import { useLive } from "../lib/hooks.js";
import { fmtTime, money } from "../lib/format.js";
import { getOrders, getSettings } from "../services";

// Orders list: use this for takeaway / delivery billing and to follow kitchen status live.
export default function OrdersPage() {
  const { data: orders, loading } = useLive(getOrders, ["orders"]);
  const { data: settings } = useLive(getSettings, ["settings"]);
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  const cur = settings ? settings.currency : "Rs.";
  const all = [...(orders || [])].reverse(); // newest first
  const isDone = (o) => o.status === "cancelled" || (o.status === "served" && o.paymentStatus === "paid");
  const q = search.trim().toLowerCase();
  const rows = all
    .filter((o) => (tab === "active" ? !isDone(o) : isDone(o)))
    .filter((o) => !q || o.id.toLowerCase().includes(q) || (o.customer && o.customer.name.toLowerCase().includes(q)));

  const opened = all.find((o) => o.id === openId);

  return (
    <div className="mx-auto max-w-4xl p-3 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Orders</h1>
        <input className="input max-w-[14rem]" placeholder="Search ID or customer" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search orders" />
      </div>

      <div className="mb-3 flex gap-1">
        {[
          ["active", "Active"],
          ["done", "Completed"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === id ? "bg-ember text-white" : "bg-white/5 text-neutral-300 hover:bg-white/10"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading orders…</p>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">{tab === "active" ? "No active orders. Place one from the POS." : "No completed orders yet."}</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((o) => (
            <li key={o.id}>
              <button onClick={() => setOpenId(o.id)} className="card flex w-full flex-wrap items-center gap-3 p-3 text-left transition hover:border-ember">
                <div className="min-w-[5.5rem]">
                  <div className="font-extrabold">{o.id}</div>
                  <div className="text-xs text-neutral-500">{fmtTime(o.createdAt)}</div>
                </div>
                <div className="flex flex-1 flex-wrap items-center gap-1.5">
                  <TypeBadge order={o} />
                  <StatusBadge status={o.status} />
                  <PayBadge paid={o.paymentStatus === "paid"} />
                </div>
                <div className="text-xs text-neutral-400">{o.items.reduce((n, i) => n + i.quantity, 0)} items</div>
                <div className="w-24 text-right font-extrabold text-gold">{money(o.total, cur)}</div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {opened && (
        <Modal title="Order details" onClose={() => setOpenId(null)}>
          <OrderPanel order={opened} settings={settings} />
        </Modal>
      )}
    </div>
  );
}
