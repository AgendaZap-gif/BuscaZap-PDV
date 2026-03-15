import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const isMaster = user?.role === "master" || user?.role === "admin_global";
  const isProdutor = user?.role === "produtor";
  const roleLabel = isMaster ? "Admin Global" : isProdutor ? "Produtor" : user?.role ?? "";
  const roleBadgeColor = isMaster ? "#FF8C42" : "#4ade80";

  const isActive = (path) => {
    if (path === "/") return loc.pathname === "/";
    return loc.pathname.startsWith(path);
  };

  const navLinkStyle = (path) => ({
    color: isActive(path) ? "#ffffff" : "#94a3b8",
    padding: "0.35rem 0.75rem",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: isActive(path) ? "600" : "500",
    fontSize: "0.875rem",
    background: isActive(path) ? "rgba(255,255,255,0.12)" : "transparent",
    transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Header */}
      <header
        style={{
          background: "var(--color-nav-bg, #1d2939)",
          color: "#fff",
          padding: "0 1.5rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        {/* Logo + Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link
            to="/"
            style={{
              color: "#fff",
              fontWeight: "800",
              fontSize: "1rem",
              textDecoration: "none",
              letterSpacing: "-0.3px",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>🎪</span>
            <span>BuscaZap</span>
            <span
              style={{
                background: "#FF8C42",
                color: "#fff",
                fontSize: "0.625rem",
                fontWeight: "700",
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Eventos
            </span>
          </Link>

          <nav style={{ display: "flex", gap: "0.25rem" }}>
            <Link to="/" style={navLinkStyle("/")}>Dashboard</Link>
            <Link to="/eventos" style={navLinkStyle("/eventos")}>Eventos</Link>
            {/* Banners só visível para admin global/master */}
            {isMaster && (
              <Link to="/banners" style={navLinkStyle("/banners")}>Banners</Link>
            )}
          </nav>
        </div>

        {/* User info + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: roleBadgeColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {(user.email || "A")[0].toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: "0.8125rem", color: "#e2e8f0", fontWeight: "500" }}>
                  {user.email}
                </div>
                {roleLabel && (
                  <div style={{ fontSize: "0.6875rem", color: roleBadgeColor, fontWeight: "600" }}>
                    {roleLabel}
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "6px",
              padding: "0.3rem 0.75rem",
              fontSize: "0.8125rem",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, padding: "1.5rem 1rem" }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "#ffffff",
          borderTop: "1px solid #e4e7ec",
          padding: "0.75rem 1.5rem",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#667085",
        }}
      >
        BuscaZap Eventos Admin &mdash; Painel de Gerenciamento
      </footer>
    </div>
  );
}
