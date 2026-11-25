import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { ROLE_ACCESS, ROLE_HOME } from "./services";
import LoginPage from "./pages/LoginPage.jsx";
import SwitchPage from "./pages/SwitchPage.jsx";
import PosPage from "./pages/PosPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import TablesPage from "./pages/TablesPage.jsx";
import KdsPage from "./pages/KdsPage.jsx";
import ManagerPage from "./pages/ManagerPage.jsx";

// Route guard: not logged in -> /login. Logged in but wrong role -> that role's home page.
function Guard({ path, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (path && !ROLE_ACCESS[user.role].includes(path)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Guard>
            <AppShell />
          </Guard>
        }
      >
        <Route path="/switch" element={<SwitchPage />} />
        <Route path="/pos" element={<Guard path="/pos"><PosPage /></Guard>} />
        <Route path="/orders" element={<Guard path="/orders"><OrdersPage /></Guard>} />
        <Route path="/tables" element={<Guard path="/tables"><TablesPage /></Guard>} />
        <Route path="/kds" element={<Guard path="/kds"><KdsPage /></Guard>} />
        <Route path="/manager" element={<Guard path="/manager"><ManagerPage /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
