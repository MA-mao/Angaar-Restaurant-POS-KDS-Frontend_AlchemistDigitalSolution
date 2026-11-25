export const TABLE_STATUS = {
  available: {
    label: "Available",
    box: "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20",
    dot: "bg-emerald-400",
  },
  occupied: {
    label: "Occupied",
    box: "border-red-500/40 bg-red-500/10 hover:bg-red-500/20",
    dot: "bg-red-400",
  },
  billing_pending: {
    label: "Billing Pending",
    box: "border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20",
    dot: "bg-amber-400",
  },
};

export function TableLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-neutral-400">
      {Object.values(TABLE_STATUS).map((s) => (
        <span key={s.label} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

// Visual floor grid. Used on the Tables page (click anything) and in the POS
// (only available tables are selectable via the `selectable` prop).
export default function TableGrid({ tables, onSelect, selectedId, selectable, compact = false }) {
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 sm:gap-3"}`}>
      {tables.map((t) => {
        const meta = TABLE_STATUS[t.status];
        const enabled = selectable ? selectable(t) : true;
        const selected = selectedId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            disabled={!enabled}
            onClick={() => onSelect(t)}
            aria-label={`Table ${t.number}, seats ${t.capacity}, ${meta.label}`}
            className={`rounded-xl border text-left transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${meta.box} ${
              compact ? "p-2" : "p-4"
            } ${selected ? "ring-2 ring-ember" : ""}`}
          >
            <div className={`font-extrabold ${compact ? "text-base" : "text-2xl"}`}>T{t.number}</div>
            <div className={`text-neutral-400 ${compact ? "text-[10px]" : "text-xs"}`}>👥 {t.capacity} seats</div>
            {!compact && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
