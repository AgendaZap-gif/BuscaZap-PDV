import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { listExpositores, getEvento, deleteExpositor } from "../services/api";

export default function Expositores() {
  const { id } = useParams();
  const [evento, setEvento] = useState(null);
  const [expositores, setExpositores] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([getEvento(id), listExpositores(id)])
      .then(([ev, list]) => {
        setEvento(ev);
        setExpositores(list);
      })
      .catch(() => {
        setEvento(null);
        setExpositores([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleDelete = async (expositorId, nome) => {
    if (!window.confirm(`Excluir expositor "${nome}"?`)) return;
    try {
      await deleteExpositor(expositorId);
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao excluir");
    }
  };

  if (loading) return <div className="container">Carregando...</div>;
  if (!evento) return <div className="container">Evento não encontrado.</div>;

  return (
    <div className="container">
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/eventos" style={{ color: "#64748b", fontSize: "0.875rem" }}>← Eventos</Link>
        <h1 style={{ margin: "0.25rem 0" }}>Expositores — {evento.nome}</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <Link to={`/eventos/${id}/mapa`} className="btn btn-secondary btn-sm">
          🗺️ Editor de mapa
        </Link>
        <Link to={`/eventos/${id}/expositores/novo`} className="btn btn-primary">
          ➕ Novo expositor
        </Link>
      </div>

      <div className="card">
        {expositores.length === 0 ? (
          <p style={{ color: "#64748b" }}>Nenhum expositor. Cadastre o primeiro e use o mapa para posicionar.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Estande</th>
                <th>Promoção</th>
                <th>Destaque</th>
                <th>Patrocinado</th>
                <th>Posição (x, y)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {expositores.map((e) => (
                <tr key={e.id}>
                  <td>{e.nome}</td>
                  <td>{e.categoria || "—"}</td>
                  <td>{e.estande || "—"}</td>
                  <td>{e.promocao ? "🏷️ " + e.promocao : "—"}</td>
                  <td>{e.destaque ? "✓" : "—"}</td>
                  <td>{e.patrocinado ? "✓" : "—"}</td>
                  <td>{e.posX != null || e.posY != null ? `${e.posX}, ${e.posY}` : "—"}</td>
                  <td>
                    <Link to={`/eventos/${id}/expositores/${e.id}/editar`} className="btn btn-sm btn-secondary" style={{ marginRight: "0.5rem" }}>
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(e.id, e.nome)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
