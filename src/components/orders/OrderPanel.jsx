import { useState } from "react";
import { PayBadge, StatusBadge, TypeBadge } from "../ui/Badges.jsx";
import { useToast } from "../ui/Toast.jsx";
import PaymentModal from "./PaymentModal.jsx";
import ReceiptModal from "../receipt/Receipt.jsx";
import { errMsg, fmtDateTime, money } from "../../lib/format.js";
import { updateOrderStatus } from "../../services";

// Shared by the Orders page and the Tables page: full order details + billing actions.
export default function OrderPanel({ order, settings }) {
  const toast = useToast();
  const cur = settings ? settings.currency : "Rs.";
  const [payOpen, setPayOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  const paid = order.paymentStatus === "paid";
  const cancelled = order.status === "cancelled";
  const canSettle = !paid && !cancelled && !(order.type === "dine-in" && ["new", "preparing"].includes(order.status));
  const canCancel = ["new", "preparing", "ready"].includes(order.status);

  async function changeStatus(status, okMsg) {
    setBusy(true);
    try {
      await updateOrderStatus(order.id, status);
      if (okMsg) toast(okMsg, "success");
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-lg font-extrabold">{order.id}</span>
        <TypeBadge order={order} />
        <StatusBadge status={order.status} />
        <PayBadge paid={paid} />
      </div>
      <div className="mb-3 text-xs text-neutral-400">
        Placed {fmtDateTime(order.createdAt)} by {order.createdBy}
        {order.customer && order.customer.name && (
          <div className="mt-1 text-neutral-300">
            👤 {order.customer.name}
            {order.customer.phone ? ` · ${order.customer.phone}` : ""}
            {order.customer.address ? ` · ${order.customer.address}` : ""}
          </div>
        )}
      </div>

      <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
        {order.items.map((i) => (
          <li key={i.lineId} className="flex justify-between gap-3 px-3 py-2 text-sm">
            <div>
              <div className="font-semibold">
                {i.quantity} × {i.name}
                {i.variant ? <span className="text-neutral-400"> ({i.variant.name})</span> : null}
              </div>
              {i.addOns.length > 0 && <div className="text-xs text-neutral-400">+ {i.addOns.map((a) => a.name).join(", ")}</div>}
              {i.notes && <div className="text-xs text-amber-300">📝 {i.notes}</div>}
            </div>
            <div className="whitespace-nowrap">{money(i.lineTotal, cur)}</div>
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between text-neutral-400">
          <span>Subtotal</span>
          <span>{money(order.subtotal, cur)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Discount {order.promoCode ? `(${order.promoCode})` : ""}</span>
            <span>-{money(order.discount, cur)}</span>
          </div>
        )}
        <div className="flex justify-between text-neutral-400">
          <span>Tax ({Math.round(order.taxRate * 100)}%)</span>
          <span>{money(order.tax, cur)}</span>
        </div>
        {order.deliveryFee > 0 && (
          <div className="flex justify-between text-neutral-400">
            <span>Delivery fee</span>
            <span>{money(order.deliveryFee, cur)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-extrabold">
          <span>Total</span>
          <span className="text-gold">{money(order.total, cur)}</span>
        </div>
        {paid && order.payment && (
          <div className="text-xs text-neutral-400">
            Paid by {order.payment.method} at {fmtDateTime(order.payment.paidAt)}
            {order.payment.method === "cash" ? ` · change ${money(order.payment.change, cur)}` : ""}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === "ready" && (
          <button className="btn btn-primary" disabled={busy} onClick={() => changeStatus("served", `${order.id} marked served`)}>
            ✅ Mark served
          </button>
        )}
        {canSettle && (
          <button className="btn btn-primary" onClick={() => setPayOpen(true)}>
            💰 Settle bill
          </button>
        )}
        {!paid && order.type === "dine-in" && ["new", "preparing"].includes(order.status) && (
          <span className="self-center text-xs text-neutral-400">Waiting for the kitchen before billing…</span>
        )}
        <button className="btn btn-ghost" onClick={() => setReceiptOrder(order)}>
          🖨 {paid ? "Receipt" : "Print bill"}
        </button>
        {canCancel && !paid && (
          <button
            className="btn btn-danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Cancel ${order.id}? This cannot be undone.`)) changeStatus("cancelled", `${order.id} cancelled`);
            }}
          >
            Cancel order
          </button>
        )}
      </div>

      {payOpen && (
        <PaymentModal
          order={order}
          currency={cur}
          onClose={() => setPayOpen(false)}
          onPaid={(paidOrder) => {
            setPayOpen(false);
            setReceiptOrder(paidOrder);
          }}
        />
      )}
      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
    </div>
  );
}
