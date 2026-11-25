import { createContext, useCallback, useContext, useState } from "react";

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

const STYLES = {
  success: "border-emerald-500/40 bg-emerald-950 text-emerald-100",
  error: "border-red-500/40 bg-red-950 text-red-100",
  info: "border-white/15 bg-neutral-900 text-neutral-100",
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  // toast("Saved", "success") | toast("Oops", "error") | toast("FYI")
  const toast = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list, { id, message, type }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3800);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[92vw] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-xl ${STYLES[t.type] || STYLES.info}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
