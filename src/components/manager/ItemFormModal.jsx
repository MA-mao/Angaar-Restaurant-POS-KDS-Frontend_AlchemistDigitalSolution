import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import { useToast } from "../ui/Toast.jsx";
import { errMsg } from "../../lib/format.js";
import { CATEGORIES, createMenuItem, ServiceError, updateMenuItem } from "../../services";

const rid = () => Math.random().toString(36).slice(2, 8);

// Add or edit a menu item (name, category, price, availability, variants, add-ons).
export default function ItemFormModal({ item, onClose }) {
  const toast = useToast();
  const editing = Boolean(item);
  const [form, setForm] = useState({
    name: item ? item.name : "",
    category: item ? item.category : "Burgers",
    basePrice: item ? String(item.basePrice) : "",
    description: item ? item.description : "",
    emoji: item ? item.emoji || "" : "🍽",
    available: item ? item.available : true,
  });
  const [variants, setVariants] = useState((item ? item.variants : []).map((v) => ({ ...v, priceDelta: String(v.priceDelta) })));
  const [addOns, setAddOns] = useState((item ? item.addOns : []).map((a) => ({ ...a, price: String(a.price) })));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    const local = {};
    if (variants.some((v) => !v.name.trim())) local.variants = "Every variant needs a name";
    if (addOns.some((a) => !a.name.trim())) local.addOns = "Every add-on needs a name";
    if (variants.some((v) => v.priceDelta !== "" && Number.isNaN(Number(v.priceDelta)))) local.variants = "Variant price change must be a number";
    if (addOns.some((a) => a.price === "" || !(Number(a.price) >= 0))) local.addOns = "Add-on prices must be 0 or more";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    const payload = {
      name: form.name,
      category: form.category,
      basePrice: form.basePrice === "" ? NaN : Number(form.basePrice),
      description: form.description,
      emoji: form.emoji,
      available: form.available,
      variants: variants.map((v) => ({ id: v.id || `v_${rid()}`, name: v.name.trim(), priceDelta: Number(v.priceDelta) || 0 })),
      addOns: addOns.map((a) => ({ id: a.id || `a_${rid()}`, name: a.name.trim(), price: Number(a.price) || 0 })),
    };

    setBusy(true);
    setErrors({});
    try {
      if (editing) await updateMenuItem(item.id, payload);
      else await createMenuItem(payload);
      toast(editing ? "Item updated" : "Item added to menu", "success");
      onClose();
    } catch (e) {
      if (e instanceof ServiceError && e.fields) setErrors(e.fields);
      else toast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={editing ? `Edit ${item.name}` : "Add menu item"}
      size="lg"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy} onClick={save}>
            {busy ? "Saving…" : editing ? "Save changes" : "Add item"}
          </button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="f-name">
            Item name
          </label>
          <input id="f-name" className="input" value={form.name} onChange={set("name")} placeholder="e.g. Peri Peri Burger" />
          {errors.name && <div className="err">{errors.name}</div>}
        </div>
        <div>
          <label className="label" htmlFor="f-cat">
            Category
          </label>
          <select id="f-cat" className="input" value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <div className="err">{errors.category}</div>}
        </div>
        <div>
          <label className="label" htmlFor="f-price">
            Base price (Rs.)
          </label>
          <input id="f-price" className="input" type="number" min="0" value={form.basePrice} onChange={set("basePrice")} />
          {errors.basePrice && <div className="err">{errors.basePrice}</div>}
        </div>
        <div>
          <label className="label" htmlFor="f-emoji">
            Emoji / icon
          </label>
          <input id="f-emoji" className="input" maxLength={4} value={form.emoji} onChange={set("emoji")} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="f-desc">
            Description
          </label>
          <input id="f-desc" className="input" value={form.description} onChange={set("description")} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
          Available for sale
        </label>
      </div>

      {/* Variants */}
      <div className="mt-5">
        <div className="mb-1 flex items-center justify-between">
          <div className="label !mb-0">Variants (sizes)</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setVariants([...variants, { id: "", name: "", priceDelta: "0" }])}>
            + Add variant
          </button>
        </div>
        {variants.length === 0 && <p className="text-xs text-neutral-500">No variants. Item has a single price.</p>}
        {variants.map((v, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              className="input"
              placeholder="Name (e.g. Large)"
              value={v.name}
              onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <input
              className="input w-32"
              type="number"
              placeholder="± price"
              value={v.priceDelta}
              onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, priceDelta: e.target.value } : x)))}
            />
            <button className="btn btn-ghost btn-sm" aria-label="Remove variant" onClick={() => setVariants(variants.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
        {errors.variants && <div className="err">{errors.variants}</div>}
      </div>

      {/* Add-ons */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="label !mb-0">Add-ons</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setAddOns([...addOns, { id: "", name: "", price: "0" }])}>
            + Add add-on
          </button>
        </div>
        {addOns.length === 0 && <p className="text-xs text-neutral-500">No add-ons.</p>}
        {addOns.map((a, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              className="input"
              placeholder="Name (e.g. Extra Cheese)"
              value={a.name}
              onChange={(e) => setAddOns(addOns.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <input
              className="input w-32"
              type="number"
              min="0"
              placeholder="Price"
              value={a.price}
              onChange={(e) => setAddOns(addOns.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
            />
            <button className="btn btn-ghost btn-sm" aria-label="Remove add-on" onClick={() => setAddOns(addOns.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
        {errors.addOns && <div className="err">{errors.addOns}</div>}
      </div>
    </Modal>
  );
}
