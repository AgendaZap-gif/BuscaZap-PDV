import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listEventos, toggleAtivoEvento } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Eventos() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    listEventos()
      .then(setEventos)
      .catch(() => setEventos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleAtivo = async (id, ativo) => {
    try {
      await toggleAtivoEvento(id, !ativo);
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao atualizar");
    }
  };

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>Eventos</h1>
        {user?.role === "master" && (
          <Link to="/eventos/novo" className="btn btn-primary">
            ➕ Novo evento
          </Link>
        )}
      </div>

      <div className="card">
        {loading ? (
          <p>Carregando...</p>
        ) : eventos.length === 0 ? (
          <p style={{ color: "#64748b" }}>Nenhum evento.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade</th>
                <th>Data início</th>
                <th>Data fim</th>
                <th>Ativo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => {
                const isAtivoPeriodo = e.dataInicio <= hoje && e.dataFim >= hoje;
                return (
                  <tr key={e.id}>
                    <td>{e.nome}</td>
                    <td>{e.cidade}</td>
                    <td>{e.dataInicio}</td>
                    <td>{e.dataFim}</td>
                    <td>
                      <button
                        type="button"
                        className={`switch ${e.ativo ? "on" : ""}`}
                        title={e.ativo ? "Desativar" : "Ativar"}
                        onClick={() => handleToggleAtivo(e.id, e.ativo)}
                      />
                      {isAtivoPeriodo && e.ativo && (
                        <span className="badge badge-success" style={{ marginLeft: "0.5rem" }}>Visível no app</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/eventos/${e.id}/editar`} className="btn btn-sm btn-secondary" style={{ marginRight: "0.5rem" }}>
                        Editar
                      </Link>
                      <Link to={`/eventos/${e.id}/expositores`} className="btn btn-sm btn-secondary" style={{ marginRight: "0.5rem" }}>
                        Expositores
                      </Link>
                      <Link to={`/eventos/${e.id}/mapa`} className="btn btn-sm btn-primary">
                        Abrir mapa
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
