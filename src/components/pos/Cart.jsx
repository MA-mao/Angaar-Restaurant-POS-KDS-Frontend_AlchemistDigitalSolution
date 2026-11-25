import TableGrid from "../tables/TableGrid.jsx";
import { calcUnitPrice } from "../../lib/pricing.js";
import { money } from "../../lib/format.js";

const TYPES = [
  ["dine-in", "🍽 Dine-In"],
  ["takeaway", "🥡 Takeaway"],
  ["delivery", "🛵 Delivery"],
];

export default function Cart({
  lines,
  onQty,
  onRemove,
  orderType,
  setOrderType,
  tables,
  tableId,
  setTableId,
  customer,
  setCustomer,
  promoInput,
  setPromoInput,
  onApplyPromo,
  onRemovePromo,
  promoApplied,
  promoMsg,
  totals,
  taxRate,
  currency,
  errors,
  onPlace,
  placing,
  onClose,
}) {
  const selectedTable = tables.find((t) => t.id === tableId);
  const setField = (k) => (e) => setCustomer({ ...customer, [k]: e.target.value });

  return (
    <div className="card flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Current order</h2>
        <button className="btn btn-ghost btn-sm lg:hidden" onClick={onClose}>
          ✕ Close
        </button>
      </div>

      {/* Order type */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1" role="tablist" aria-label="Order type">
        {TYPES.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={orderType === id}
            onClick={() => setOrderType(id)}
            className={`rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm ${
              orderType === id ? "bg-ember text-white" : "text-neutral-300 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table picker / customer details */}
      {orderType === "dine-in" ? (
        <div>
          <div className="label">
            Select table {selectedTable ? <span className="text-ember">· Table {selectedTable.number} chosen</span> : null}
          </div>
          <TableGrid
            compact
            tables={tables}
            selectedId={tableId}
            selectable={(t) => t.status === "available"}
            onSelect={(t) => setTableId(t.id)}
          />
          {errors.tableId && <div className="err">{errors.tableId}</div>}
        </div>
      ) : (
        <div className="grid gap-2">
          <div>
            <label className="label" htmlFor="c-name">
              Customer name {orderType === "takeaway" ? "(optional)" : ""}
            </label>
            <input id="c-name" className="input" value={customer.name} onChange={setField("name")} placeholder="Name" />
            {errors.customerName && <div className="err">{errors.customerName}</div>}
          </div>
          <div>
            <label className="label" htmlFor="c-phone">
              Phone {orderType === "takeaway" ? "(optional)" : ""}
            </label>
            <input id="c-phone" className="input" inputMode="tel" value={customer.phone} onChange={setField("phone")} placeholder="03xx xxxxxxx" />
            {errors.customerPhone && <div className="err">{errors.customerPhone}</div>}
          </div>
          {orderType === "delivery" && (
            <div>
              <label className="label" htmlFor="c-addr">
                Delivery address
              </label>
              <textarea id="c-addr" className="input min-h-[60px] resize-none" value={customer.address} onChange={setField("address")} placeholder="House, street, area" />
              {errors.customerAddress && <div className="err">{errors.customerAddress}</div>}
            </div>
          )}
        </div>
      )}

      {/* Lines */}
      <div>
        <div className="label">Items ({lines.reduce((n, l) => n + l.quantity, 0)})</div>
        {lines.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-neutral-500">
            Cart is empty. Tap a menu item to add it.
          </div>
        ) : (
          <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
            {lines.map((l) => {
              const unit = calcUnitPrice(l.item, l.variant, l.addOns);
              return (
                <li key={l.key} className="px-3 py-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {l.item.name}
                        {l.variant ? <span className="text-neutral-400"> ({l.variant.name})</span> : null}
                      </div>
                      {l.addOns.length > 0 && <div className="text-xs text-neutral-400">+ {l.addOns.map((a) => a.name).join(", ")}</div>}
                      {l.notes && <div className="text-xs text-amber-300">📝 {l.notes}</div>}
                    </div>
                    <div className="whitespace-nowrap font-semibold">{money(unit * l.quantity, currency)}</div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center rounded-md border border-white/10">
                      <button className="px-2.5 py-0.5" aria-label={`Decrease ${l.item.name}`} onClick={() => onQty(l.key, -1)}>
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{l.quantity}</span>
                      <button className="px-2.5 py-0.5" aria-label={`Increase ${l.item.name}`} onClick={() => onQty(l.key, 1)}>
                        +
                      </button>
                    </div>
                    <button className="text-xs text-red-400 hover:underline" onClick={() => onRemove(l.key)}>
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {errors.items && <div className="err">{errors.items}</div>}
      </div>

      {/* Promo */}
      <div>
        <div className="label">Promo / discount code</div>
        {promoApplied ? (
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
            <span>
              ✅ <b>{promoApplied}</b>
              {promoMsg && <span className="ml-2 text-xs text-amber-300">{promoMsg}</span>}
            </span>
            <button className="text-xs text-red-400 hover:underline" onClick={onRemovePromo}>
              Remove
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                className="input uppercase"
                placeholder="e.g. ANGAAR10"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onApplyPromo()}
                aria-label="Promo code"
              />
              <button className="btn btn-ghost" onClick={onApplyPromo}>
                Apply
              </button>
            </div>
            {(promoMsg || errors.promoCode) && <div className="err">{promoMsg || errors.promoCode}</div>}
          </>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-1 border-t border-white/10 pt-3 text-sm">
        <div className="flex justify-between text-neutral-400">
          <span>Subtotal</span>
          <span>{money(totals.subtotal, currency)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Discount</span>
            <span>-{money(totals.discount, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-neutral-400">
          <span>Tax ({Math.round(taxRate * 100)}%)</span>
          <span>{money(totals.tax, currency)}</span>
        </div>
        {totals.deliveryFee > 0 && (
          <div className="flex justify-between text-neutral-400">
            <span>Delivery fee</span>
            <span>{money(totals.deliveryFee, currency)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 text-xl font-extrabold">
          <span>Total</span>
          <span className="text-gold">{money(totals.total, currency)}</span>
        </div>
      </div>

      <button className="btn btn-primary w-full py-3 text-base" disabled={lines.length === 0 || placing} onClick={onPlace}>
        {placing ? "Sending…" : `🔥 Place order · ${money(totals.total, currency)}`}
      </button>
    </div>
  );
}
