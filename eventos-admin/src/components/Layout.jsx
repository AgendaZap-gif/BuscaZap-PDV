import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          background: "#1e3a5f",
          color: "#fff",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link to="/" style={{ color: "#fff", fontWeight: "700", fontSize: "1.25rem" }}>
            🎪 Eventos Admin
          </Link>
          <nav style={{ display: "flex", gap: "0.5rem" }}>
            <Link
              to="/"
              style={{
                color: loc.pathname === "/" ? "#93c5fd" : "#e2e8f0",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/eventos"
              style={{
                color: loc.pathname.startsWith("/eventos") && !loc.pathname.includes("/expositores") && !loc.pathname.includes("/mapa") ? "#93c5fd" : "#e2e8f0",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              Eventos
            </Link>
            <Link
              to="/banners"
              style={{
                color: loc.pathname === "/banners" ? "#93c5fd" : "#e2e8f0",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              Banners
            </Link>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
            {user?.email} {user?.role === "master" && "(master)"}
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <main style={{ flex: 1, padding: "1rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
