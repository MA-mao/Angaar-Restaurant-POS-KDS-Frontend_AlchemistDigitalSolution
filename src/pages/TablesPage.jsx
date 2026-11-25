import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import OrderPanel from "../components/orders/OrderPanel.jsx";
import TableGrid, { TABLE_STATUS, TableLegend } from "../components/tables/TableGrid.jsx";
import { useLive } from "../lib/hooks.js";
import { errMsg } from "../lib/format.js";
import { getOrder, getSettings, getTables, requestBill } from "../services";

// `orderId` is the order that was on the table when it was tapped. We keep it (instead of reading the
// table live) so the modal stays open and shows the paid receipt after the table is freed.
function TableModal({ tableId, orderId, settings, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: tables } = useLive(getTables, ["tables"]);
  const table = (tables || []).find((t) => t.id === tableId);
  const { data: order, error } = useLive(() => (orderId ? getOrder(orderId) : Promise.resolve(null)), ["orders"], [orderId]);

  if (!table) return null;
  const meta = TABLE_STATUS[table.status];

  async function bill() {
    try {
      await requestBill(table.id);
      toast(`Table ${table.number} moved to billing`, "success");
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }

  return (
    <Modal title={`Table ${table.number} · ${table.capacity} seats`} size="md" onClose={onClose}>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="font-semibold">{meta.label}</span>
        {table.status === "occupied" && (
          <button className="btn btn-ghost btn-sm ml-auto" onClick={bill}>
            🧾 Request bill
          </button>
        )}
      </div>

      {!orderId ? (
        <div className="py-6 text-center">
          <p className="mb-4 text-neutral-400">This table is free.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/pos?table=${table.id}`)}>
            Start an order for Table {table.number}
          </button>
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">Could not load the order.</p>
      ) : !order ? (
        <p className="text-sm text-neutral-400">Loading order…</p>
      ) : (
        <OrderPanel order={order} settings={settings} />
      )}
    </Modal>
  );
}

export default function TablesPage() {
  const { data: tables, loading } = useLive(getTables, ["tables"]);
  const { data: settings } = useLive(getSettings, ["settings"]);
  const [selected, setSelected] = useState(null); // { id, orderId }

  const list = tables || [];
  const count = (s) => list.filter((t) => t.status === s).length;

  return (
    <div className="mx-auto max-w-[1200px] p-3 lg:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Floor map</h1>
          <p className="text-xs text-neutral-500">Tap an occupied table to see its order and settle the bill.</p>
        </div>
        <TableLegend />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {Object.entries(TABLE_STATUS).map(([key, m]) => (
          <div key={key} className="card p-3 text-center">
            <div className="text-2xl font-extrabold">{count(key)}</div>
            <div className="text-xs text-neutral-400">{m.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Loading tables…</p>
      ) : (
        <TableGrid tables={list} onSelect={(t) => setSelected({ id: t.id, orderId: t.currentOrderId })} />
      )}

      {selected && (
        <TableModal key={selected.id} tableId={selected.id} orderId={selected.orderId} settings={settings} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
