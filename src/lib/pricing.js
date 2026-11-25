// Pure pricing helpers. Used by the cart UI (live preview) AND by orderService (authoritative total),
// so both always agree. No storage access here.

export const PROMOS = [
  { code: "ANGAAR10", type: "percent", value: 10, description: "10% off your bill" },
  { code: "STUDENT15", type: "percent", value: 15, minSubtotal: 500, description: "15% off (min Rs. 500)" },
  { code: "CRUMBS100", type: "flat", value: 100, minSubtotal: 1000, description: "Rs. 100 off (min Rs. 1000)" },
];

// Returns { valid, promo, discount, message }
export function applyPromo(code, subtotal) {
  const clean = String(code || "").trim().toUpperCase();
  if (!clean) return { valid: false, promo: null, discount: 0, message: "Enter a promo code" };

  const promo = PROMOS.find((p) => p.code === clean);
  if (!promo) return { valid: false, promo: null, discount: 0, message: "Invalid promo code" };

  if (promo.minSubtotal && subtotal < promo.minSubtotal) {
    return {
      valid: false,
      promo,
      discount: 0,
      message: `Minimum order of Rs. ${promo.minSubtotal} required for ${promo.code}`,
    };
  }

  const raw = promo.type === "percent" ? (subtotal * promo.value) / 100 : promo.value;
  const discount = Math.min(Math.round(raw), subtotal); // never more than the bill
  return { valid: true, promo, discount, message: `${promo.code} applied` };
}

export function calcUnitPrice(item, variant, addOns) {
  return item.basePrice + (variant ? variant.priceDelta : 0) + addOns.reduce((sum, a) => sum + a.price, 0);
}

// Tax is charged on (subtotal - discount). Delivery fee is added after tax.
export function calcTotals(subtotal, discount, taxRate, deliveryFee = 0) {
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxRate);
  return { subtotal, discount, tax, deliveryFee, total: taxable + tax + deliveryFee };
}
