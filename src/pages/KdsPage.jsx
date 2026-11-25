import { useEffect, useRef, useState } from "react";
import TicketCard from "../components/kds/TicketCard.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useLive, useNow } from "../lib/hooks.js";
import { errMsg } from "../lib/format.js";
import { getOrders, getSettings, updateOrderStatus, updateSettings } from "../services";

const COLUMNS = [
  { key: "new", title: "New Orders", icon: "🆕", next: "preparing", nextLabel: "▶ Start preparing", back: null, head: "border-blue-500/50 text-blue-300" },
  { key: "preparing", title: "Preparing", icon: "🔥", next: "ready", nextLabel: "✔ Mark ready", back: "new", head: "border-amber-500/50 text-amber-300" },
  { key: "ready", title: "Ready for Pickup", icon: "✅", next: "served", nextLabel: "Picked up / served", back: "preparing", head: "border-emerald-500/50 text-emerald-300" },
];

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* audio not available, ignore */
  }
}

// Configurable alert thresholds (saved to settings, also editable by the manager).
function Thresholds({ settings }) {
  const toast = useToast();
  const [warn, setWarn] = useState(String(settings.kdsWarnMinutes));
  const [late, setLate] = useState(String(settings.kdsLateMinutes));

  useEffect(() => {
    setWarn(String(settings.kdsWarnMinutes));
    setLate(String(settings.kdsLateMinutes));
  }, [settings.kdsWarnMinutes, settings.kdsLateMinutes]);

  async function save() {
    if (Number(warn) === settings.kdsWarnMinutes && Number(late) === settings.kdsLateMinutes) return;
    try {
      await updateSettings({ kdsWarnMinutes: Number(warn), kdsLateMinutes: Number(late) });
      toast("Alert times saved", "success");
    } catch (e) {
      toast(errMsg(e), "error");
      setWarn(String(settings.kdsWarnMinutes));
      setLate(String(settings.kdsLateMinutes));
    }
  }

  const box = "input !w-16 !px-2 !py-1 text-center";
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-400">
      <span className="text-amber-300">Amber ≥</span>
      <input className={box} type="number" min="1" value={warn} onChange={(e) => setWarn(e.target.value)} onBlur={save} aria-label="Amber threshold minutes" />
      <span className="text-red-400">Red ≥</span>
      <input className={box} type="number" min="1" value={late} onChange={(e) => setLate(e.target.value)} onBlur={save} aria-label="Red threshold minutes" />
      <span>min</span>
    </div>
  );
}

export default function KdsPage() {
  const toast = useToast();
  const { data: orders, loading } = useLive(() => getOrders({ status: ["new", "preparing", "ready"] }), ["orders"]);
  const { data: settings } = useLive(getSettings, ["settings"]);
  const now = useNow(1000);
  const [sound, setSound] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Beep when a NEW order arrives so chefs never miss one.
  const prevNew = useRef(null);
  useEffect(() => {
    if (!orders) return;
    const count = orders.filter((o) => o.status === "new").length;
    if (prevNew.current !== null && count > prevNew.current && sound) beep();
    prevNew.current = count;
  }, [orders, sound]);

  async function move(order, status) {
    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, status);
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusyId(null);
    }
  }

  const warnMin = settings ? settings.kdsWarnMinutes : 10;
  const lateMin = settings ? settings.kdsLateMinutes : 15;
  const list = orders || [];

  return (
    <div className="p-3 lg:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Kitchen Display</h1>
          <p className="text-xs text-neutral-500">
            {list.length} active order{list.length === 1 ? "" : "s"} · live
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {settings && <Thresholds settings={settings} />}
          <button className="btn btn-ghost btn-sm" onClick={() => setSound((s) => !s)} aria-pressed={sound}>
            {sound ? "🔔 Sound on" : "🔕 Sound off"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading orders…</p>
      ) : (
       <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colOrders = list.filter((o) => o.status === col.key);
            return (
              <section key={col.key} className="rounded-2xl border border-white/10 bg-neutral-950/60 p-2" aria-label={col.title}>
                <h2 className={`mb-2 flex items-center justify-between rounded-lg border-b-2 bg-white/5 px-3 py-2 text-sm font-extrabold uppercase tracking-wide ${col.head}`}>
                  <span>
                    {col.icon} {col.title}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{colOrders.length}</span>
                </h2>
                <div className="space-y-2">
                  {colOrders.length === 0 && <p className="py-8 text-center text-sm text-neutral-600">No orders</p>}
                  {colOrders.map((o) => (
                    <TicketCard
                      key={o.id}
                      order={o}
                      column={col}
                      now={now}
                      warnMin={warnMin}
                      lateMin={lateMin}
                      busy={busyId === o.id}
                      onAdvance={() => move(o, col.next)}
                      onBack={col.back ? () => move(o, col.back) : null}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
