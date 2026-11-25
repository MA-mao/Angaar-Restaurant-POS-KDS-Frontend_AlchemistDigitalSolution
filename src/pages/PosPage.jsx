import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Cart from "../components/pos/Cart.jsx";
import CustomizeModal from "../components/pos/CustomizeModal.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLive } from "../lib/hooks.js";
import { applyPromo, calcTotals, calcUnitPrice } from "../lib/pricing.js";
import { errMsg, money } from "../lib/format.js";
import { CATEGORIES, createOrder, getMenu, getSettings, getTables, ServiceError } from "../services";

const lineSig = (l) =>
  [l.item.id, l.variant ? l.variant.id : "", l.addOns.map((a) => a.id).sort().join("+"), l.notes.trim().toLowerCase()].join("|");

const EMPTY_CUSTOMER = { name: "", phone: "", address: "" };

export default function PosPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();

  const { data: menu, loading } = useLive(getMenu, ["menu"]);
  const { data: settings } = useLive(getSettings, ["settings"]);
  const { data: tables } = useLive(getTables, ["tables"]);

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [customizing, setCustomizing] = useState(null);

  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("dine-in");
  const [tableId, setTableId] = useState(params.get("table"));
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const currency = settings ? settings.currency : "Rs.";
  const taxRate = settings ? settings.taxRate : 0.13;

  /* ---------- Menu filtering (category + instant search) ---------- */
  const q = search.trim().toLowerCase();
  const items = (menu || []).filter((m) => (category === "All" || m.category === category) && m.name.toLowerCase().includes(q));

  /* ---------- Cart maths ---------- */
  const subtotal = cart.reduce((sum, l) => sum + calcUnitPrice(l.item, l.variant, l.addOns) * l.quantity, 0);
  const promoResult = promoApplied ? applyPromo(promoApplied, subtotal) : null;
  const discount = promoResult && promoResult.valid ? promoResult.discount : 0;
  const deliveryFee = orderType === "delivery" && settings ? settings.deliveryFee : 0;
  const totals = calcTotals(subtotal, discount, taxRate, deliveryFee);
  const cartCount = cart.reduce((n, l) => n + l.quantity, 0);
  const promoWarning = promoApplied && promoResult && !promoResult.valid ? promoResult.message : "";

  /* ---------- Cart actions ---------- */
  function addToCart(line) {
    setCart((prev) => {
      const sig = lineSig(line);
      const idx = prev.findIndex((l) => lineSig(l) === sig);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: Math.min(50, copy[idx].quantity + line.quantity) };
        return copy;
      }
      return [...prev, { ...line, key: Math.random().toString(36).slice(2) }];
    });
    setCustomizing(null);
    setErrors((e) => ({ ...e, items: undefined }));
    toast(`Added ${line.quantity} × ${line.item.name}`, "info");
  }

  function changeQty(key, delta) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, Math.max(1, l.quantity + delta)) } : l)));
  }

  function applyPromoCode() {
    const r = applyPromo(promoInput, subtotal);
    if (r.valid) {
      setPromoApplied(r.promo.code);
      setPromoMsg("");
      setPromoInput("");
      toast(`${r.promo.code} applied: ${r.promo.description}`, "success");
    } else {
      setPromoMsg(r.message);
    }
  }

  async function placeOrder() {
    setErrors({});
    setPlacing(true);
    try {
      const order = await createOrder(
        {
          type: orderType,
          tableId: orderType === "dine-in" ? tableId : null,
          customer:
            orderType === "dine-in"
              ? null
              : { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim() },
          items: cart.map((l) => ({
            menuItemId: l.item.id,
            variantId: l.variant ? l.variant.id : null,
            addOnIds: l.addOns.map((a) => a.id),
            quantity: l.quantity,
            notes: l.notes,
          })),
          promoCode: promoApplied || null,
        },
        user ? user.name : "cashier"
      );
      toast(`${order.id} sent to the kitchen 🔥`, "success");
      setCart([]);
      setTableId(null);
      setCustomer(EMPTY_CUSTOMER);
      setPromoApplied("");
      setPromoInput("");
      setPromoMsg("");
      setCartOpen(false);
    } catch (e) {
      if (e instanceof ServiceError) {
        if (e.fields) setErrors(e.fields);
        if (e.code === "CONFLICT") setTableId(null); // table got taken by someone else
      }
      toast(errMsg(e), "error");
    } finally {
      setPlacing(false);
    }
  }

  return (
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_400px] lg:p-4">
      {/* ---------- Menu ---------- */}
      <section className="min-w-0">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="input sm:max-w-sm"
            placeholder="🔍 Search menu by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search menu"
          />
          <div className="-mx-3 flex gap-1 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="tablist" aria-label="Menu categories">
            {["All", ...CATEGORIES].map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  category === c ? "bg-ember text-white" : "bg-white/5 text-neutral-300 hover:bg-white/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-400">Loading menu…</p>
        ) : items.length === 0 ? (
          <div className="card p-10 text-center text-neutral-500">No items found{q ? ` for "${search}"` : ""}.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {items.map((m) => (
              <button
                key={m.id}
                disabled={!m.available}
                onClick={() => setCustomizing(m)}
               className="card relative flex flex-col items-start p-3 text-left transition hover:border-ember hover:bg-neutral-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="text-4xl">{m.emoji || "🍽"}</div>
                <div className="mt-2 font-bold leading-tight">{m.name}</div>
                <div className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{m.description}</div>
                <div className="mt-2 font-extrabold text-gold">
                  {m.variants.length > 1 ? "from " : ""}
                  {money(m.basePrice + Math.min(0, ...m.variants.map((v) => v.priceDelta)), currency)}
                </div>
                {!m.available && (
                  <span className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold">SOLD OUT</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Cart (drawer on mobile, sticky panel on desktop) ---------- */}
      <div
        className={`${
          cartOpen ? "fixed inset-0 z-40 overflow-y-auto bg-neutral-950 p-3" : "hidden"
        } lg:sticky lg:top-20 lg:z-auto lg:block lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:bg-transparent lg:p-0`}
      >
        <Cart
          lines={cart}
          onQty={changeQty}
          onRemove={(key) => setCart((prev) => prev.filter((l) => l.key !== key))}
          orderType={orderType}
          setOrderType={(t) => {
            setOrderType(t);
            setErrors({});
          }}
          tables={tables || []}
          tableId={tableId}
          setTableId={(id) => {
            setTableId(id);
            setErrors((e) => ({ ...e, tableId: undefined }));
          }}
          customer={customer}
          setCustomer={setCustomer}
          promoInput={promoInput}
          setPromoInput={(v) => {
            setPromoInput(v);
            setPromoMsg("");
          }}
          onApplyPromo={applyPromoCode}
          onRemovePromo={() => {
            setPromoApplied("");
            setPromoMsg("");
          }}
          promoApplied={promoApplied}
          promoMsg={promoWarning || promoMsg}
          totals={totals}
          taxRate={taxRate}
          currency={currency}
          errors={errors}
          onPlace={placeOrder}
          placing={placing}
          onClose={() => setCartOpen(false)}
        />
      </div>

      {!cartOpen && (
        <button className="btn btn-primary fixed bottom-4 right-4 z-30 rounded-full px-5 py-3 shadow-xl lg:hidden" onClick={() => setCartOpen(true)}>
          🛒 {cartCount} · {money(totals.total, currency)}
        </button>
      )}

      {customizing && (
        <CustomizeModal item={customizing} currency={currency} onClose={() => setCustomizing(null)} onAdd={addToCart} />
      )}
    </div>
  );
}
