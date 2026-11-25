import { useEffect } from "react";

const WIDTH = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" };

export default function Modal({ title, onClose, children, footer, size = "md" }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label={typeof title === "string" ? title : undefined}
        className={`flex max-h-[92vh] w-full ${WIDTH[size]} flex-col rounded-t-2xl border border-white/10 bg-neutral-900 shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-neutral-400 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-white/10 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
