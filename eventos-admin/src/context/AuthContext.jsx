import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminRaw = localStorage.getItem("eventos_admin_user");
    const expositorRaw = localStorage.getItem("eventos_expositor_user");
    if (adminRaw) {
      try {
        setUser(JSON.parse(adminRaw));
      } catch {
        localStorage.removeItem("eventos_admin_user");
        localStorage.removeItem("eventos_admin_token");
      }
    } else if (expositorRaw) {
      try {
        setUser(JSON.parse(expositorRaw));
      } catch {
        localStorage.removeItem("eventos_expositor_user");
        localStorage.removeItem("eventos_expositor_token");
      }
    }
    setLoading(false);
  }, []);

  const login = (token, admin) => {
    localStorage.removeItem("eventos_expositor_token");
    localStorage.removeItem("eventos_expositor_user");
    localStorage.setItem("eventos_admin_token", token);
    localStorage.setItem("eventos_admin_user", JSON.stringify(admin));
    setUser(admin);
  };

  const loginExpositor = (token, expositor) => {
    const data = { tipo: "expositor", ...expositor };
    localStorage.removeItem("eventos_admin_token");
    localStorage.removeItem("eventos_admin_user");
    localStorage.setItem("eventos_expositor_token", token);
    localStorage.setItem("eventos_expositor_user", JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    const isExpositor = user?.tipo === "expositor";
    localStorage.removeItem("eventos_admin_token");
    localStorage.removeItem("eventos_admin_user");
    localStorage.removeItem("eventos_expositor_token");
    localStorage.removeItem("eventos_expositor_user");
    setUser(null);
    window.location.href = isExpositor ? "/expositor/login" : "/login";
  };

  const isExpositor = user?.tipo === "expositor";

  return (
    <AuthContext.Provider value={{ user, loading, login, loginExpositor, logout, isExpositor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
