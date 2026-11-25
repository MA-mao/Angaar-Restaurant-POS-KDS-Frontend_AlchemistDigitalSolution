import { useState } from "react";
import MenuManager from "../components/manager/MenuManager.jsx";
import SalesCards from "../components/manager/SalesCards.jsx";
import SettingsForm from "../components/manager/SettingsForm.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useLive } from "../lib/hooks.js";
import { errMsg } from "../lib/format.js";
import { seedDemoSales } from "../lib/demo.js";
import { getSettings, resetDemoData } from "../services";

export default function ManagerPage() {
  const toast = useToast();
  const { data: settings } = useLive(getSettings, ["settings"]);
  const [busy, setBusy] = useState(false);

  async function addSamples() {
    setBusy(true);
    try {
      await seedDemoSales();
      toast("4 sample paid orders added", "success");
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (!window.confirm("Reset menu, orders, tables and settings to the original demo data?")) return;
    resetDemoData();
    toast("Demo data reset", "success");
  }

  return (
    <div className="mx-auto max-w-[1300px] space-y-8 p-3 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Manager dashboard</h1>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={addSamples}>
            {busy ? "Adding…" : "＋ Add sample sales"}
          </button>
          <button className="btn btn-ghost btn-sm text-red-400" onClick={reset}>
            Reset demo data
          </button>
        </div>
      </div>

      <SalesCards currency={settings ? settings.currency : "Rs."} />
      <MenuManager currency={settings ? settings.currency : "Rs."} />
      {settings && <SettingsForm settings={settings} />}
    </div>
  );
}
