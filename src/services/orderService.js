// Future REST:
//   GET   /api/orders?status=new,preparing&date=YYYY-MM-DD   -> getOrders(filter)
//   GET   /api/orders/:id                                    -> getOrder(id)
//   POST  /api/orders                                        -> createOrder(input)
//   PATCH /api/orders/:id/status   { status }                -> updateOrderStatus(id, status)
//   POST  /api/orders/:id/payment  { method, amountTendered } -> settlePayment(id, payment)
//   GET   /api/reports/sales?date=YYYY-MM-DD                 -> getSalesSummary(date)
import { applyPromo, calcTotals, calcUnitPrice } from "../lib/pricing";
import { ServiceError } from "./errors";
import { readMenu } from "./menuService";
import { readSettings } from "./settingsService";
import { KEYS, latency, nextOrderNumber, read, uid, write } from "./storage";
import { assignOrderToTable, markBillingPending, readTables, releaseTable } from "./tableService";

// Allowed kitchen status moves. "Back" moves exist so a mis-tap can be undone.
const TRANSITIONS = {
  new: ["preparing", "cancelled"],
  preparing: ["ready", "new", "cancelled"],
  ready: ["served", "preparing", "cancelled"],
  served: [],
  cancelled: [],
};

const localDate = (iso) => new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD

function readOrders() {
  return read(KEYS.orders, []);
}

function findOrderIndex(orders, id) {
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) throw new ServiceError("NOT_FOUND", "Order not found");
  return idx;
}

/* ---------- Reads ---------- */
// filter: { status?: string[], paymentStatus?: "paid"|"unpaid", tableId?: string, date?: "YYYY-MM-DD" }
export async function getOrders(filter = {}) {
  await latency();
  return readOrders()
    .filter((o) => !filter.status || filter.status.includes(o.status))
    .filter((o) => !filter.paymentStatus || o.paymentStatus === filter.paymentStatus)
    .filter((o) => !filter.tableId || o.tableId === filter.tableId)
    .filter((o) => !filter.date || localDate(o.createdAt) === filter.date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // oldest first (KDS priority)
}

export async function getOrder(id) {
  await latency();
  const orders = readOrders();
  return orders[findOrderIndex(orders, id)];
}

/* ---------- Create ---------- */
// input: { type, tableId?, customer?, items: [{ menuItemId, variantId?, addOnIds?, quantity, notes? }], promoCode?, notes? }
export async function createOrder(input, createdBy = "cashier") {
  await latency();

  // 1. Validate input
  const fields = {};
  if (!input.items || input.items.length === 0) fields.items = "Cart is empty";
  if (input.type === "dine-in" && !input.tableId) fields.tableId = "Select a table for dine-in orders";
  if (input.type === "delivery") {
    const c = input.customer || {};
    if (!(c.name || "").trim()) fields.customerName = "Customer name is required for delivery";
    if (!/^[0-9+\-\s]{10,15}$/.test((c.phone || "").trim())) fields.customerPhone = "Enter a valid phone number";
    if (!(c.address || "").trim()) fields.customerAddress = "Delivery address is required";
  }
  if (Object.keys(fields).length) throw new ServiceError("VALIDATION", "Please fix the highlighted fields", fields);

  // 2. Build items from the menu (prices are recalculated here, never trusted from the client)
  const menu = readMenu();
  const items = input.items.map((line) => {
    const menuItem = menu.find((m) => m.id === line.menuItemId);
    if (!menuItem) throw new ServiceError("NOT_FOUND", `Menu item not found: ${line.menuItemId}`);
    if (!menuItem.available) throw new ServiceError("CONFLICT", `${menuItem.name} is currently unavailable`);

    const quantity = Math.floor(line.quantity);
    if (!(quantity >= 1 && quantity <= 50)) {
      throw new ServiceError("VALIDATION", `Invalid quantity for ${menuItem.name}`, { items: "Quantity must be 1 to 50" });
    }

    let variant = null;
    if (menuItem.variants.length > 0) {
      variant = line.variantId ? menuItem.variants.find((v) => v.id === line.variantId) || null : menuItem.variants[0];
      if (!variant) throw new ServiceError("VALIDATION", `Invalid size for ${menuItem.name}`);
    }

    const addOns = (line.addOnIds || []).map((id) => {
      const found = menuItem.addOns.find((a) => a.id === id);
      if (!found) throw new ServiceError("VALIDATION", `Invalid add-on for ${menuItem.name}`);
      return found;
    });

    const unitPrice = calcUnitPrice(menuItem, variant, addOns);
    return {
      lineId: uid("ln"),
      menuItemId: menuItem.id,
      name: menuItem.name,
      variant,
      addOns,
      quantity,
      notes: (line.notes || "").trim().slice(0, 140),
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });

  // 3. Table check (dine-in)
  let tableId = null;
  let tableNumber = null;
  if (input.type === "dine-in") {
    const table = readTables().find((t) => t.id === input.tableId);
    if (!table) throw new ServiceError("NOT_FOUND", "Table not found");
    if (table.status !== "available") throw new ServiceError("CONFLICT", `Table ${table.number} is not available`);
    tableId = table.id;
    tableNumber = table.number;
  }

  // 4. Totals
  const settings = readSettings();
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  let discount = 0;
  let promoCode = null;
  if (input.promoCode && input.promoCode.trim()) {
    const result = applyPromo(input.promoCode, subtotal);
    if (!result.valid) throw new ServiceError("VALIDATION", result.message, { promoCode: result.message });
    discount = result.discount;
    promoCode = result.promo ? result.promo.code : null;
  }
  const deliveryFee = input.type === "delivery" ? settings.deliveryFee : 0;
  const totals = calcTotals(subtotal, discount, settings.taxRate, deliveryFee);

  // 5. Save
  const hasCustomer = input.type === "delivery" || (input.customer && input.customer.name);
  const order = {
    id: `ORD-${nextOrderNumber()}`,
    type: input.type,
    tableId,
    tableNumber,
    customer: hasCustomer ? input.customer || null : null,
    items,
    notes: (input.notes || "").trim(),
    promoCode,
    subtotal: totals.subtotal,
    discount: totals.discount,
    taxRate: settings.taxRate,
    tax: totals.tax,
    deliveryFee: totals.deliveryFee,
    total: totals.total,
    status: "new",
    paymentStatus: "unpaid",
    payment: null,
    createdBy,
    createdAt: new Date().toISOString(),
    preparingAt: null,
    readyAt: null,
    servedAt: null,
    cancelledAt: null,
  };

  write(KEYS.orders, [...readOrders(), order]);
  if (tableId) assignOrderToTable(tableId, order.id);
  return order;
}

/* ---------- Kitchen status ---------- */
export async function updateOrderStatus(orderId, status) {
  await latency();
  const orders = readOrders();
  const idx = findOrderIndex(orders, orderId);
  const order = orders[idx];

  if (!(TRANSITIONS[order.status] || []).includes(status)) {
    throw new ServiceError("INVALID_STATE", `Cannot move an order from "${order.status}" to "${status}"`);
  }

  const now = new Date().toISOString();
  const updated = { ...order, status };
  if (status === "new") updated.preparingAt = null;
  if (status === "preparing") {
    updated.preparingAt = order.preparingAt || now;
    updated.readyAt = null;
  }
  if (status === "ready") updated.readyAt = now;
  if (status === "served") updated.servedAt = now;
  if (status === "cancelled") updated.cancelledAt = now;

  orders[idx] = updated;
  write(KEYS.orders, orders);

  // Table side effects: this is what keeps POS / Table views in sync with the KDS.
  if (updated.tableId) {
    if (status === "served") markBillingPending(updated.tableId);
    if (status === "cancelled") releaseTable(updated.tableId);
  }
  return updated;
}

/* ---------- Payment ---------- */
// payment: { method: "cash"|"card"|"online", amountTendered?: number }
export async function settlePayment(orderId, payment) {
  await latency();
  const orders = readOrders();
  const idx = findOrderIndex(orders, orderId);
  const order = orders[idx];

  if (order.paymentStatus === "paid") throw new ServiceError("CONFLICT", "This order is already paid");
  if (order.status === "cancelled") throw new ServiceError("INVALID_STATE", "A cancelled order cannot be paid");
  if (order.type === "dine-in" && (order.status === "new" || order.status === "preparing")) {
    throw new ServiceError("INVALID_STATE", "Dine-in bill can be settled once the food is ready");
  }
  if (!["cash", "card", "online"].includes(payment.method)) {
    throw new ServiceError("VALIDATION", "Choose a payment method", { method: "Payment method is required" });
  }

  const tendered = payment.method === "cash" ? Number(payment.amountTendered ?? order.total) : order.total;
  if (!(tendered >= order.total)) {
    throw new ServiceError("VALIDATION", "Amount received is less than the total", {
      amountTendered: `Need at least ${order.total}`,
    });
  }

  const now = new Date().toISOString();
  const updated = {
    ...order,
    paymentStatus: "paid",
    payment: { method: payment.method, amountTendered: tendered, change: tendered - order.total, paidAt: now },
  };
  // Dine-in paid straight from "ready": the customer has the food, so mark it served.
  if (order.type === "dine-in" && order.status === "ready") {
    updated.status = "served";
    updated.servedAt = now;
  }

  orders[idx] = updated;
  write(KEYS.orders, orders);
  if (updated.tableId) releaseTable(updated.tableId); // bill settled => table is free
  return updated;
}

/* ---------- Manager report ---------- */
export async function getSalesSummary(date) {
  await latency();
  const day = date || localDate(new Date().toISOString());
  const orders = readOrders();

  const placed = orders.filter((o) => localDate(o.createdAt) === day);
  const paid = orders.filter((o) => o.payment && localDate(o.payment.paidAt) === day);

  const byPaymentMethod = { cash: 0, card: 0, online: 0 };
  const byOrderType = { "dine-in": 0, takeaway: 0, delivery: 0 };
  const itemMap = new Map();

  paid.forEach((o) => {
    byPaymentMethod[o.payment.method] += o.total;
    byOrderType[o.type] += o.total;
    o.items.forEach((i) => {
      const row = itemMap.get(i.name) || { quantity: 0, revenue: 0 };
      row.quantity += i.quantity;
      row.revenue += i.lineTotal;
      itemMap.set(i.name, row);
    });
  });

  const revenue = paid.reduce((sum, o) => sum + o.total, 0);
  const topItems = Array.from(itemMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    date: day,
    ordersPlaced: placed.length,
    ordersPaid: paid.length,
    activeOrders: orders.filter((o) => ["new", "preparing", "ready"].includes(o.status)).length,
    cancelledOrders: placed.filter((o) => o.status === "cancelled").length,
    revenue,
    avgOrderValue: paid.length ? Math.round(revenue / paid.length) : 0,
    discounts: paid.reduce((sum, o) => sum + o.discount, 0),
    tax: paid.reduce((sum, o) => sum + o.tax, 0),
    byPaymentMethod,
    byOrderType,
    topItems,
  };
}
