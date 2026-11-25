import { STATUS_LABEL, TYPE_LABEL } from "../../lib/format";

const BASE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";

const TYPE_STYLE = {
  "dine-in": "border-sky-500/30 bg-sky-500/15 text-sky-300",
  takeaway: "border-violet-500/30 bg-violet-500/15 text-violet-300",
  delivery: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
};

const STATUS_STYLE = {
  new: "border-blue-500/30 bg-blue-500/15 text-blue-300",
  preparing: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  ready: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  served: "border-white/15 bg-white/10 text-neutral-300",
  cancelled: "border-red-500/30 bg-red-500/15 text-red-300",
};

export function TypeBadge({ order }) {
  const label = order.type === "dine-in" ? `Table ${order.tableNumber}` : TYPE_LABEL[order.type];
  return <span className={`${BASE} ${TYPE_STYLE[order.type]}`}>{label}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`${BASE} ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function PayBadge({ paid }) {
  return (
    <span
      className={`${BASE} ${
        paid
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
          : "border-red-500/30 bg-red-500/15 text-red-300"
      }`}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}
