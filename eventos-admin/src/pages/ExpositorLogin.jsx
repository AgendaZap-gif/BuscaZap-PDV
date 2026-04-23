import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { expositorLogin } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ExpositorLogin() {
  const navigate = useNavigate();
  const { loginExpositor } = useAuth();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, expositor } = await expositorLogin(login.trim(), senha);
      loginExpositor(token, expositor);
      navigate("/expositor", { replace: true });
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
        background: "linear-gradient(135deg, #166534 0%, #0f172a 100%)",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.5rem" }}>
          🏪 Área do Expositor
        </h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
          Faça login para editar as imagens da sua empresa (logo e título da página).
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="ex: empresa@email.com"
              required
              autoComplete="username"
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
          <a href="/login" style={{ color: "#166534" }}>Sou administrador do evento</a>
        </p>
      </div>
    </div>
  );
}
