import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLE_HOME, ServiceError } from "../services";

const DEMOS = [
  { label: "Cashier", username: "cashier", password: "cashier123", icon: "🧾" },
  { label: "Kitchen", username: "kitchen", password: "kitchen123", icon: "👨‍🍳" },
  { label: "Manager", username: "manager", password: "manager123", icon: "📊" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      const session = await login(form.username, form.password);
      navigate(ROLE_HOME[session.user.role], { replace: true });
    } catch (err) {
      if (err instanceof ServiceError) setErrors({ ...(err.fields || {}), form: err.fields ? "" : err.message });
      else setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,#3a1507_0%,#0e0e0e_60%)] p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-5xl">🔥</div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[0.3em] text-ember">ANGAAR</h1>
          <p className="mt-1 text-sm text-neutral-400">Ate &amp; Left No Crumbs.</p>
        </div>

        <form onSubmit={submit} noValidate className="card space-y-4 p-6 shadow-2xl">
          <h2 className="text-lg font-bold">Staff login</h2>

          {errors.form && (
            <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.form}
            </div>
          )}

          <div>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="cashier / kitchen / manager"
            />
            {errors.username && <div className="err">{errors.username}</div>}
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
            {errors.password && <div className="err">{errors.password}</div>}
          </div>

          <button className="btn btn-primary w-full py-2.5" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <div>
            <div className="mb-2 text-center text-xs text-neutral-500">Demo accounts (tap to fill)</div>
            <div className="grid grid-cols-3 gap-2">
              {DEMOS.map((d) => (
                <button
                  key={d.username}
                  type="button"
                  className="btn btn-ghost flex-col gap-0 py-2 text-xs"
                  onClick={() => {
                    setErrors({});
                    setForm({ username: d.username, password: d.password });
                  }}
                >
                  <span className="text-lg">{d.icon}</span>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
