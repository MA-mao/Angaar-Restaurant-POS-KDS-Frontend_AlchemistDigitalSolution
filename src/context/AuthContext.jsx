import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as svc from "../services";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => svc.getSessionSync());

  // Keep all tabs in sync (login/logout in one tab updates the others).
  useEffect(() => svc.subscribe(["session"], () => setSession(svc.getSessionSync())), []);

  const value = useMemo(
    () => ({
      session,
      user: session ? session.user : null,
      login: async (username, password) => {
        const s = await svc.login(username, password);
        setSession(s);
        return s;
      },
      logout: async () => {
        await svc.logout();
        setSession(null);
      },
      switchRole: async (role) => {
        const s = await svc.switchRole(role);
        setSession(s);
        return s;
      },
    }),
    [session]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
