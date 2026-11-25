import { createPortal } from "react-dom";
import Modal from "../ui/Modal.jsx";
import { useLive } from "../../lib/hooks.js";
import { fmtDateTime, METHOD_LABEL, money, TYPE_LABEL } from "../../lib/format.js";
import { getSettings } from "../../services";

function Row({ left, right, bold }) {
  return (
    <div className={`flex justify-between gap-2 ${bold ? "font-bold" : ""}`}>
      <span>{left}</span>
      <span className="whitespace-nowrap">{right}</span>
    </div>
  );
}

const Dash = () => <div className="my-2 border-t border-dashed border-black" />;

// 80mm thermal-style receipt. Plain black on white so it prints cleanly.
export function ReceiptContent({ order, settings }) {
  const cur = settings.currency;
  const paid = order.paymentStatus === "paid";
  return (
    <div className="mx-auto w-[72mm] bg-white p-2 font-mono text-[11px] leading-snug text-black">
      <div className="text-center">
        <div className="text-xl font-extrabold tracking-[0.25em]">{settings.restaurantName}</div>
        <div>{settings.tagline}</div>
        <div>{settings.address}</div>
        <div>{settings.phone}</div>
      </div>
      <Dash />
      <Row left="Order #" right={order.id} bold />
      <Row left="Date" right={fmtDateTime(order.createdAt)} />
      <Row
        left="Type"
        right={order.type === "dine-in" ? `Dine-In (Table ${order.tableNumber})` : TYPE_LABEL[order.type]}
      />
      <Row left="Served by" right={order.createdBy} />
      {order.customer && order.customer.name && <Row left="Customer" right={order.customer.name} />}
      {order.customer && order.customer.phone && <Row left="Phone" right={order.customer.phone} />}
      {order.customer && order.customer.address && <div>Addr: {order.customer.address}</div>}
      <Dash />

      {order.items.map((i) => (
        <div key={i.lineId} className="mb-1.5">
          <Row left={`${i.quantity} x ${i.name}`} right={money(i.lineTotal, cur)} />
          {i.variant && <div className="pl-3">- {i.variant.name}</div>}
          {i.addOns.map((a) => (
            <div key={a.id} className="pl-3">
              + {a.name}
            </div>
          ))}
          {i.notes && <div className="pl-3 italic">* {i.notes}</div>}
        </div>
      ))}
      <Dash />

      <Row left="Subtotal" right={money(order.subtotal, cur)} />
      {order.discount > 0 && (
        <Row left={`Discount${order.promoCode ? ` (${order.promoCode})` : ""}`} right={`-${money(order.discount, cur)}`} />
      )}
      <Row left={`Tax (${Math.round(order.taxRate * 100)}%)`} right={money(order.tax, cur)} />
      {order.deliveryFee > 0 && <Row left="Delivery fee" right={money(order.deliveryFee, cur)} />}
      <div className="my-1 border-t border-black" />
      <div className="text-sm">
        <Row left="TOTAL" right={money(order.total, cur)} bold />
      </div>
      <Dash />

      {paid ? (
        <>
          <Row left="Payment" right={METHOD_LABEL[order.payment.method]} bold />
          {order.payment.method === "cash" && (
            <>
              <Row left="Cash received" right={money(order.payment.amountTendered, cur)} />
              <Row left="Change" right={money(order.payment.change, cur)} />
            </>
          )}
          <Row left="Paid at" right={fmtDateTime(order.payment.paidAt)} />
        </>
      ) : (
        <div className="text-center font-bold">** PAYMENT PENDING **</div>
      )}
      <Dash />
      <div className="text-center">
        <div className="font-bold">Thank you!</div>
        <div>{settings.tagline}</div>
      </div>
    </div>
  );
}

export default function ReceiptModal({ order, onClose }) {
  const { data: settings } = useLive(getSettings, ["settings"]);

  return (
    <>
      <Modal
        title={`Receipt ${order.id}`}
        size="sm"
        onClose={onClose}
        footer={
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1" onClick={onClose}>
              Close
            </button>
            <button className="btn btn-primary flex-1" onClick={() => window.print()}>
              🖨 Print
            </button>
          </div>
        }
      >
        {settings ? (
          <div className="overflow-x-auto rounded-lg bg-white py-2">
            <ReceiptContent order={order} settings={settings} />
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Loading receipt…</p>
        )}
      </Modal>

      {/* Print-only copy. index.css hides the app and shows only #print-root when printing. */}
      {settings &&
        createPortal(
          <div id="print-root">
            <ReceiptContent order={order} settings={settings} />
          </div>,
          document.body
        )}
    </>
  );
}
