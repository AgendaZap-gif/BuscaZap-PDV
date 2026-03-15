import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginImproved() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const [accessType, setAccessType] = useState("admin"); // admin, produtor, expositor
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, admin } = await login(email, senha, accessType);
      setAuth(token, { ...admin, accessType });
      
      // Redirecionar baseado no tipo de acesso
      const routes = {
        admin: "/dashboard",
        produtor: "/produtor/dashboard",
        expositor: "/expositor/dashboard"
      };
      
      navigate(routes[accessType], { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Falha no login. Verifique email e senha.");
    } finally {
      setLoading(false);
    }
  };

  const accessTypeOptions = [
    { value: "admin", label: "👨‍💼 Admin Global", description: "Gerenciar todos os eventos" },
    { value: "produtor", label: "🎪 Produtor de Evento", description: "Gerenciar meu evento" },
    { value: "expositor", label: "🏢 Expositor", description: "Gerenciar meu perfil" }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
        padding: "1rem"
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 450 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.8rem" }}>
            🌾 Agro Events
          </h1>
          <p style={{ color: "#64748b", marginBottom: 0, fontSize: "0.875rem" }}>
            Painel de Gerenciamento de Eventos
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Seleção de Tipo de Acesso */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600 }}>
              Tipo de Acesso
            </label>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {accessTypeOptions.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "1rem",
                    border: `2px solid ${accessType === option.value ? "#3b82f6" : "#e2e8f0"}`,
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    backgroundColor: accessType === option.value ? "#f0f9ff" : "#f8fafc",
                    transition: "all 0.2s"
                  }}
                >
                  <input
                    type="radio"
                    name="accessType"
                    value={option.value}
                    checked={accessType === option.value}
                    onChange={(e) => setAccessType(e.target.value)}
                    style={{ marginRight: "0.75rem", cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Senha */}
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div style={{
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              marginBottom: "1rem",
              fontSize: "0.875rem"
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Botão de Login */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: "100%",
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? "⏳ Entrando..." : "✓ Entrar"}
          </button>
        </form>

        {/* Links Adicionais */}
        <div style={{
          marginTop: "1.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid #e2e8f0",
          fontSize: "0.75rem",
          color: "#64748b",
          textAlign: "center"
        }}>
          <p style={{ marginBottom: "0.5rem" }}>
            Primeira vez? <a href="/register" style={{ color: "#3b82f6", textDecoration: "none" }}>Criar conta</a>
          </p>
          <p style={{ marginBottom: 0 }}>
            Esqueceu a senha? <a href="/reset-password" style={{ color: "#3b82f6", textDecoration: "none" }}>Recuperar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
