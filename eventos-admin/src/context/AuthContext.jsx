import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("eventos_admin_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem("eventos_admin_user");
        localStorage.removeItem("eventos_admin_token");
      }
    }
    setLoading(false);
  }, []);

  const login = (token, admin) => {
    localStorage.setItem("eventos_admin_token", token);
    localStorage.setItem("eventos_admin_user", JSON.stringify(admin));
    setUser(admin);
  };

  const logout = () => {
    localStorage.removeItem("eventos_admin_token");
    localStorage.removeItem("eventos_admin_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
