import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import { useToast } from "../ui/Toast.jsx";
import { errMsg, money } from "../../lib/format.js";
import { ServiceError, settlePayment } from "../../services";

const METHODS = [
  { id: "cash", label: "💵 Cash" },
  { id: "card", label: "💳 Card" },
  { id: "online", label: "📱 Online" },
];

export default function PaymentModal({ order, currency = "Rs.", onClose, onPaid }) {
  const toast = useToast();
  const [method, setMethod] = useState("cash");
  const [tendered, setTendered] = useState(String(order.total));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const received = Number(tendered);
  const change = method === "cash" && received >= order.total ? received - order.total : 0;

  // Quick cash buttons: exact, next 500, next 1000, next 5000
  const quick = Array.from(
    new Set([order.total, Math.ceil(order.total / 500) * 500, Math.ceil(order.total / 1000) * 1000, Math.ceil(order.total / 5000) * 5000])
  );

  async function confirm() {
    setErrors({});
    if (method === "cash" && !(received >= order.total)) {
      setErrors({ amountTendered: `Cash received must be at least ${money(order.total, currency)}` });
      return;
    }
    setBusy(true);
    try {
      const paid = await settlePayment(order.id, { method, amountTendered: method === "cash" ? received : undefined });
      toast(`${order.id} paid via ${method}`, "success");
      onPaid(paid);
    } catch (e) {
      if (e instanceof ServiceError && e.fields) setErrors(e.fields);
      toast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Settle bill ${order.id}`}
      size="sm"
      onClose={onClose}
      footer={
        <button className="btn btn-primary w-full" disabled={busy} onClick={confirm}>
          {busy ? "Processing…" : `Confirm payment ${money(order.total, currency)}`}
        </button>
      }
    >
      <div className="mb-4 rounded-lg bg-white/5 p-3 text-center">
        <div className="text-xs uppercase tracking-wide text-neutral-400">Amount due</div>
        <div className="text-3xl font-extrabold text-gold">{money(order.total, currency)}</div>
      </div>

      <div className="label">Payment method</div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`rounded-lg border px-2 py-3 text-sm font-semibold transition ${
              method === m.id ? "border-ember bg-ember/20 text-white" : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === "cash" && (
        <div>
          <label className="label" htmlFor="tendered">
            Cash received
          </label>
          <input
            id="tendered"
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            value={tendered}
            onChange={(e) => setTendered(e.target.value)}
          />
          {errors.amountTendered && <div className="err">{errors.amountTendered}</div>}
          <div className="mt-2 flex flex-wrap gap-2">
            {quick.map((q) => (
              <button key={q} type="button" className="btn btn-ghost btn-sm" onClick={() => setTendered(String(q))}>
                {money(q, currency)}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-neutral-400">Change to return</span>
            <span className="font-bold text-emerald-400">{money(change, currency)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
