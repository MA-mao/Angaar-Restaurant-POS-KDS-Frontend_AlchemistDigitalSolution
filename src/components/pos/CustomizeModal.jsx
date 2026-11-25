import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import { calcUnitPrice } from "../../lib/pricing.js";
import { money } from "../../lib/format.js";

const NOTE_CHIPS = ["No onions", "Extra spicy", "Less salt", "No ice", "Well done"];

// Variant (size), add-ons and kitchen notes for one menu item.
export default function CustomizeModal({ item, currency = "Rs.", onClose, onAdd }) {
  const [variantId, setVariantId] = useState(item.variants.length ? item.variants[0].id : null);
  const [addOnIds, setAddOnIds] = useState([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  const variant = item.variants.find((v) => v.id === variantId) || null;
  const addOns = item.addOns.filter((a) => addOnIds.includes(a.id));
  const unit = calcUnitPrice(item, variant, addOns);

  const toggleAddOn = (id) => setAddOnIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const addChip = (chip) => {
    if (notes.toLowerCase().includes(chip.toLowerCase())) return;
    setNotes((n) => (n ? `${n}, ${chip}` : chip).slice(0, 140));
  };

  return (
    <Modal
      title={`${item.emoji || ""} ${item.name}`}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-white/10">
            <button type="button" className="px-3 py-2 text-lg" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span className="w-8 text-center font-bold" aria-label="Quantity">
              {qty}
            </span>
            <button type="button" className="px-3 py-2 text-lg" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(50, q + 1))}>
              +
            </button>
          </div>
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => onAdd({ item, variant, addOns, quantity: qty, notes: notes.trim() })}
          >
            Add to order · {money(unit * qty, currency)}
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-neutral-400">{item.description}</p>

      {item.variants.length > 0 && (
        <section className="mb-4">
          <div className="label">Size / variant</div>
          <div className="flex flex-wrap gap-2">
            {item.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  variantId === v.id ? "border-ember bg-ember/20" : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                {v.name}
                {v.priceDelta !== 0 && (
                  <span className="ml-1 text-xs text-neutral-400">
                    {v.priceDelta > 0 ? "+" : "−"}
                    {Math.abs(v.priceDelta)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {item.addOns.length > 0 && (
        <section className="mb-4">
          <div className="label">Add-ons</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {item.addOns.map((a) => {
              const on = addOnIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleAddOn(a.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                    on ? "border-ember bg-ember/20" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span>
                    {on ? "☑" : "☐"} {a.name}
                  </span>
                  <span className="text-xs text-neutral-400">+{a.price}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <label className="label" htmlFor="kitchen-notes">
          Special kitchen notes
        </label>
        <textarea
          id="kitchen-notes"
          className="input min-h-[72px] resize-none"
          maxLength={140}
          placeholder='e.g. "No onions"'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {NOTE_CHIPS.map((c) => (
            <button key={c} type="button" className="btn btn-ghost btn-sm" onClick={() => addChip(c)}>
              {c}
            </button>
          ))}
        </div>
      </section>
    </Modal>
  );
}
