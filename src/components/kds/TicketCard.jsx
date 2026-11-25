import { TypeBadge } from "../ui/Badges.jsx";
import { elapsed, fmtTime } from "../../lib/format.js";

const TONE = {
  ok: "border-white/10 bg-neutral-900",
  done: "border-emerald-500/30 bg-emerald-500/5",
  warn: "border-amber-500 bg-amber-500/10",
  late: "border-red-500 bg-red-500/10",
};

// One kitchen ticket: order id, type badge, items + notes, live elapsed timer.
export default function TicketCard({ order, column, now, warnMin, lateMin, busy, onAdvance, onBack }) {
  const isReady = column.key === "ready";
  const end = isReady && order.readyAt ? new Date(order.readyAt).getTime() : now;
  const ms = end - new Date(order.createdAt).getTime();
  const mins = ms / 60000;

  let tone = isReady ? "done" : "ok";
  if (!isReady && mins >= lateMin) tone = "late";
  else if (!isReady && mins >= warnMin) tone = "warn";

  const timerColor = { ok: "text-neutral-100", done: "text-emerald-300", warn: "text-amber-300", late: "text-red-400 animate-pulse" }[tone];

  return (
    <article className={`rounded-xl border-2 p-3 ${TONE[tone]}`} data-tone={tone}>
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-extrabold leading-tight">{order.id}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TypeBadge order={order} />
            <span className="text-xs text-neutral-400">{fmtTime(order.createdAt)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-2xl font-extrabold tabular-nums ${timerColor}`} aria-label="Elapsed time">
            {elapsed(ms)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            {isReady ? "took (mins)" : tone === "late" ? "LATE · mins" : "mins"}
          </div>
        </div>
      </header>

      <ul className="space-y-1.5 border-t border-white/10 pt-2">
        {order.items.map((i) => (
          <li key={i.lineId} className="text-sm">
            <div className="font-semibold">
              <span className="mr-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">{i.quantity}×</span>
              {i.name}
              {i.variant ? <span className="text-neutral-400"> ({i.variant.name})</span> : null}
            </div>
            {i.addOns.length > 0 && <div className="pl-7 text-xs text-sky-300">+ {i.addOns.map((a) => a.name).join(", ")}</div>}
            {i.notes && <div className="ml-7 mt-0.5 rounded bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300">📝 {i.notes}</div>}
          </li>
        ))}
      </ul>

      <footer className="mt-3 flex gap-2">
        {onBack && (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={onBack} aria-label="Move back">
            ↩
          </button>
        )}
        <button className="btn btn-primary btn-sm flex-1" disabled={busy} onClick={onAdvance}>
          {column.nextLabel}
        </button>
      </footer>
    </article>
  );
}
