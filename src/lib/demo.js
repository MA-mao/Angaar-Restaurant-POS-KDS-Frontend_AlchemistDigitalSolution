// Demo helper for the Manager page: creates a few completed sales so the summary cards have data.
import { createOrder, settlePayment, updateOrderStatus } from "../services";

const SAMPLES = [
  {
    type: "takeaway",
    method: "card",
    items: [
      { menuItemId: "m_smash", variantId: "double", addOnIds: ["cheese"], quantity: 2 },
      { menuItemId: "m_margarita", variantId: "large", quantity: 2 },
    ],
  },
  {
    type: "takeaway",
    method: "cash",
    items: [
      { menuItemId: "m_tikka", variantId: "large", addOnIds: ["crust"], quantity: 1 },
      { menuItemId: "m_lava", quantity: 2 },
    ],
  },
  {
    type: "takeaway",
    method: "online",
    items: [
      { menuItemId: "m_zinger", variantId: "single", quantity: 3 },
      { menuItemId: "m_soft", quantity: 3 },
    ],
  },
  {
    type: "takeaway",
    method: "cash",
    promoCode: "ANGAAR10",
    items: [{ menuItemId: "m_family", quantity: 1 }],
  },
];

export async function seedDemoSales() {
  for (const s of SAMPLES) {
    const order = await createOrder({ type: s.type, items: s.items, promoCode: s.promoCode || null }, "Demo");
    await updateOrderStatus(order.id, "preparing");
    await updateOrderStatus(order.id, "ready");
    await updateOrderStatus(order.id, "served");
    await settlePayment(order.id, {
      method: s.method,
      amountTendered: s.method === "cash" ? order.total + 200 : order.total,
    });
  }
}
