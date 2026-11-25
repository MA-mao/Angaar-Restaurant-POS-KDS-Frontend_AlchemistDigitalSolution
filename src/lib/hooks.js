import { useCallback, useEffect, useRef, useState } from "react";
import { subscribe } from "../services";

// Fetch data from a service AND re-fetch automatically whenever any of `keys`
// change (same tab or another tab). This is what makes KDS -> POS -> Tables update instantly.
//   const { data, loading, error, reload } = useLive(getOrders, ["orders"]);
export function useLive(fetcher, keys, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;
  const keyStr = keys.join(",");
  const depStr = JSON.stringify(deps);

  const load = useCallback(
    () =>
      fetchRef
        .current()
        .then((data) => setState({ data, loading: false, error: null }))
        .catch((error) => setState((s) => ({ ...s, loading: false, error }))),
    []
  );

  useEffect(() => {
    load();
    return subscribe(keyStr.split(","), load);
  }, [load, keyStr, depStr]);

  return { ...state, reload: load };
}

// Ticks every `ms` milliseconds, returns Date.now(). Drives the KDS running timers.
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
