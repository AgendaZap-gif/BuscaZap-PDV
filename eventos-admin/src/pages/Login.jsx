import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, admin } = await login(email, senha);
      setAuth(token, admin);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Falha no login. Verifique email e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.5rem" }}>
          🎪 Eventos Admin
        </h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.875rem", lineHeight: 1.45 }}>
          Painel do produtor de feira: use <strong style={{ color: "#475569" }}>eventos.buscazapbrasil.com.br</strong>.
          O <strong style={{ color: "#475569" }}>PDV</strong> (pdv.buscazapbrasil.com.br) é só o restaurante. Dados e
          login vêm da API do <strong style={{ color: "#475569" }}>buscazap-eventos-service</strong>.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@exemplo.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#64748b", textAlign: "center" }}>
          <a href="/expositor/login" style={{ color: "#93c5fd" }}>Sou expositor (acessar minha área)</a>
        </p>
      </div>
    </div>
  );
}
