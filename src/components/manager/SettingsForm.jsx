import { useEffect, useState } from "react";
import { useToast } from "../ui/Toast.jsx";
import { errMsg } from "../../lib/format.js";
import { ServiceError, updateSettings } from "../../services";

// Restaurant info (shown on receipts), tax, delivery fee and KDS alert thresholds.
export default function SettingsForm({ settings }) {
  const toast = useToast();
  const toForm = (s) => ({
    restaurantName: s.restaurantName,
    tagline: s.tagline,
    address: s.address,
    phone: s.phone,
    taxPercent: String(Math.round(s.taxRate * 1000) / 10),
    deliveryFee: String(s.deliveryFee),
    kdsWarnMinutes: String(s.kdsWarnMinutes),
    kdsLateMinutes: String(s.kdsLateMinutes),
  });
  const [form, setForm] = useState(() => toForm(settings));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm(toForm(settings)), [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      await updateSettings({
        restaurantName: form.restaurantName,
        tagline: form.tagline,
        address: form.address,
        phone: form.phone,
        taxRate: Number(form.taxPercent) / 100,
        deliveryFee: Number(form.deliveryFee),
        kdsWarnMinutes: Number(form.kdsWarnMinutes),
        kdsLateMinutes: Number(form.kdsLateMinutes),
      });
      toast("Settings saved", "success");
    } catch (err) {
      if (err instanceof ServiceError && err.fields) setErrors(err.fields);
      toast(errMsg(err), "error");
    } finally {
      setBusy(false);
    }
  }

  const Field = ({ id, label, type = "text", field, errKey, ...rest }) => (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="input" type={type} value={form[field]} onChange={set(field)} {...rest} />
      {errors[errKey || field] && <div className="err">{errors[errKey || field]}</div>}
    </div>
  );

  return (
    <section>
      <h2 className="mb-3 text-xl font-extrabold">Settings</h2>
      <form onSubmit={save} className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="s-name" label="Restaurant name" field="restaurantName" />
        <Field id="s-tag" label="Tagline" field="tagline" />
        <Field id="s-addr" label="Address" field="address" />
        <Field id="s-phone" label="Phone" field="phone" />
        <Field id="s-tax" label="Tax (%)" type="number" step="0.1" min="0" max="100" field="taxPercent" errKey="taxRate" />
        <Field id="s-del" label="Delivery fee (Rs.)" type="number" min="0" field="deliveryFee" />
        <Field id="s-warn" label="KDS amber after (min)" type="number" min="1" field="kdsWarnMinutes" />
        <Field id="s-late" label="KDS red after (min)" type="number" min="1" field="kdsLateMinutes" />
        <div className="sm:col-span-2 lg:col-span-4">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
