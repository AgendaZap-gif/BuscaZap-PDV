import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listEventos } from "../services/api";

export default function Dashboard() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEventos()
      .then(setEventos)
      .catch(() => setEventos([]))
      .finally(() => setLoading(false));
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);
  const ativos = eventos.filter(
    (e) => e.ativo && e.dataInicio <= hoje && e.dataFim >= hoje
  );
  const totalExpositores = eventos.reduce((acc, e) => acc + (e.expositoresCount ?? 0), 0);
  // We don't have expositoresCount in list - could add to API later. For now show events count.
  const totalEventos = eventos.length;

  return (
    <div className="container">
      <h1 style={{ marginBottom: "1rem" }}>Dashboard</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Eventos ativos (hoje)</div>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#16a34a" }}>
            {loading ? "..." : ativos.length}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Total de eventos</div>
          <div style={{ fontSize: "2rem", fontWeight: "700" }}>
            {loading ? "..." : totalEventos}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ margin: 0 }}>Eventos</h2>
          <Link to="/eventos/novo" className="btn btn-primary">
            ➕ Criar evento
          </Link>
        </div>
        {loading ? (
          <p style={{ color: "#64748b" }}>Carregando...</p>
        ) : eventos.length === 0 ? (
          <p style={{ color: "#64748b" }}>Nenhum evento. Crie o primeiro!</p>
        ) : (
          <table style={{ marginTop: "1rem" }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade</th>
                <th>Período</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => {
                const isAtivo = e.ativo && e.dataInicio <= hoje && e.dataFim >= hoje;
                return (
                  <tr key={e.id}>
                    <td>{e.nome}</td>
                    <td>{e.cidade}</td>
                    <td>
                      {e.dataInicio} — {e.dataFim}
                    </td>
                    <td>
                      <span className={`badge ${isAtivo ? "badge-success" : "badge-warning"}`}>
                        {isAtivo ? "Ativo" : e.ativo ? "Fora do período" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <Link to={`/eventos/${e.id}/editar`} className="btn btn-sm btn-secondary" style={{ marginRight: "0.5rem" }}>
                        Editar
                      </Link>
                      <Link to={`/eventos/${e.id}/expositores`} className="btn btn-sm btn-secondary" style={{ marginRight: "0.5rem" }}>
                        Expositores
                      </Link>
                      <Link to={`/eventos/${e.id}/mapa`} className="btn btn-sm btn-secondary">
                        Mapa
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
