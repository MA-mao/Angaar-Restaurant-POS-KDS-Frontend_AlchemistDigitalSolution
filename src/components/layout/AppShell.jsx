import { useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useLive } from "../../lib/hooks.js";
import { getOrders, ROLE_ACCESS } from "../../services";

const NAV = [
  { to: "/pos", label: "POS" },
  { to: "/orders", label: "Orders" },
  { to: "/tables", label: "Tables" },
  { to: "/kds", label: "Kitchen" },
  { to: "/manager", label: "Manager" },
];

const ROLE_LABEL = { cashier: "Cashier", kitchen: "Kitchen", manager: "Manager" };

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Watches live orders: when the kitchen marks something Ready, cashier/manager get a toast.
  const { data: active } = useLive(() => getOrders({ status: ["new", "preparing", "ready"] }), ["orders"]);
  const prev = useRef(null);

  useEffect(() => {
    if (!active || !user) return;
    const map = {};
    active.forEach((o) => {
      map[o.id] = o.status;
    });
    if (prev.current && user.role !== "kitchen") {
      active.forEach((o) => {
        if (o.status === "ready" && prev.current[o.id] && prev.current[o.id] !== "ready") {
          const where = o.type === "dine-in" ? `Table ${o.tableNumber}` : o.type;
          toast(`🔔 ${o.id} (${where}) is READY`, "success");
        }
      });
    }
    prev.current = map;
  }, [active, user, toast]);

  const links = user ? NAV.filter((n) => ROLE_ACCESS[user.role].includes(n.to)) : [];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 lg:px-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold tracking-widest text-ember">🔥 ANGAAR</span>
            <span className="hidden text-xs text-neutral-500 md:inline">Ate &amp; Left No Crumbs.</span>
          </div>

          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:mx-0 md:w-auto md:flex-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    isActive ? "bg-ember text-white" : "text-neutral-300 hover:bg-white/10"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-xs text-neutral-500">{user ? ROLE_LABEL[user.role] : ""}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/switch")}>
              Switch role
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
