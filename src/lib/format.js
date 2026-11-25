export const money = (n, currency = "Rs.") =>
  `${currency} ${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

// 265000 ms -> "04:25"
export function elapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const todayISO = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

export const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
export const STATUS_LABEL = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};
export const METHOD_LABEL = { cash: "Cash", card: "Card", online: "Online" };

// First readable message from a ServiceError (field message if present).
export const errMsg = (e) => {
  if (e && e.fields) {
    const first = Object.values(e.fields)[0];
    if (first) return first;
  }
  return (e && e.message) || "Something went wrong";
};
