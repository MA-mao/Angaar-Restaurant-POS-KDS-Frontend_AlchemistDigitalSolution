import { useState } from "react";
import { useLive } from "../../lib/hooks.js";
import { METHOD_LABEL, money, TYPE_LABEL, todayISO } from "../../lib/format.js";
import { getSalesSummary } from "../../services";

function Stat({ label, value, hint, accent }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${accent || ""}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}

function Bars({ title, rows, currency }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="card p-4">
      <div className="label">{title}</div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{r.label}</span>
              <span className="text-neutral-400">{money(r.value, currency)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-ember transition-all" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SalesCards({ currency = "Rs." }) {
  const [date, setDate] = useState(todayISO());
  const { data: s, loading } = useLive(() => getSalesSummary(date), ["orders"], [date]);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold">Daily sales summary</h2>
        <input
          type="date"
          className="input w-auto"
          value={date}
          max={todayISO()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          aria-label="Report date"
        />
      </div>

      {loading || !s ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <Stat label="Revenue" value={money(s.revenue, currency)} accent="text-gold" hint={`${s.ordersPaid} paid orders`} />
            <Stat label="Orders placed" value={s.ordersPlaced} hint={`${s.cancelledOrders} cancelled`} />
            <Stat label="Avg order value" value={money(s.avgOrderValue, currency)} />
            <Stat label="Active now" value={s.activeOrders} hint="in kitchen" accent="text-ember" />
            <Stat label="Discounts given" value={money(s.discounts, currency)} />
            <Stat label="Tax collected" value={money(s.tax, currency)} />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Bars
              title="By payment method"
              currency={currency}
              rows={Object.entries(s.byPaymentMethod).map(([k, v]) => ({ label: METHOD_LABEL[k], value: v }))}
            />
            <Bars
              title="By order type"
              currency={currency}
              rows={Object.entries(s.byOrderType).map(([k, v]) => ({ label: TYPE_LABEL[k], value: v }))}
            />
            <div className="card p-4">
              <div className="label">Top selling items</div>
              {s.topItems.length === 0 ? (
                <p className="text-sm text-neutral-500">No paid orders on this date yet.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {s.topItems.map((t, i) => (
                    <li key={t.name} className="flex justify-between gap-2">
                      <span>
                        <span className="mr-2 text-neutral-500">{i + 1}.</span>
                        {t.name} <span className="text-xs text-neutral-500">×{t.quantity}</span>
                      </span>
                      <span className="whitespace-nowrap text-neutral-300">{money(t.revenue, currency)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
