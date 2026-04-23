import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { deleteEvento, listEventos, toggleAtivoEvento } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatDateBR(iso) {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function Eventos() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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

  const handleDelete = async (id, nome) => {
    if (user?.role !== "master" && user?.role !== "admin_global") return;
    const ok = window.confirm(`Excluir definitivamente a feira "${nome}"? Esta ação não pode ser desfeita.`);
    if (!ok) return;
    try {
      await deleteEvento(id);
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Erro ao excluir feira");
    }
  };

  const hoje = new Date().toISOString().slice(0, 10);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eventos;
    return eventos.filter(
      (e) =>
        (e.nome || "").toLowerCase().includes(q) ||
        (e.cidade || "").toLowerCase().includes(q) ||
        (e.categoria || "").toLowerCase().includes(q)
    );
  }, [eventos, query]);

  const isMaster = user?.role === "master" || user?.role === "admin_global";

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      {/* Hero / explicação */}
      <div
        style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 45%, #f8fafc 100%)",
          border: "1px solid #e4e7ec",
          borderRadius: 16,
          padding: "1.5rem 1.5rem 1.25rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ flex: "1 1 280px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#FF8C42", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              Painel BuscaZap
            </div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#101828", letterSpacing: "-0.02em" }}>
              Feiras na cidade
            </h1>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#667085", lineHeight: 1.55, maxWidth: 560 }}>
              Aqui você cria e gerencia as <strong style={{ color: "#344054", fontWeight: 600 }}>feiras</strong> que aparecem no app em{" "}
              <strong style={{ color: "#344054", fontWeight: 600 }}>Eventos</strong>, junto com os eventos cadastrados pelos usuários.
              Cadastre expositores, mapa interativo e páginas por estande — o fluxo completo fica neste painel.
            </p>
          </div>
          {isMaster && (
            <Link
              to="/eventos/novo"
              className="btn btn-primary"
              style={{
                padding: "0.65rem 1.25rem",
                fontWeight: 700,
                borderRadius: 10,
                boxShadow: "0 1px 2px rgba(16,24,40,0.08)",
                whiteSpace: "nowrap",
                alignSelf: "center",
              }}
            >
              ➕ Nova feira
            </Link>
          )}
        </div>

        <div style={{ marginTop: "1.1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="search"
            placeholder="Buscar por nome, cidade ou categoria…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: "1 1 240px",
              maxWidth: 400,
              padding: "0.55rem 0.875rem",
              borderRadius: 10,
              border: "1px solid #d0d5dd",
              fontSize: "0.875rem",
              outline: "none",
              background: "#fff",
            }}
          />
          <span style={{ fontSize: "0.8125rem", color: "#667085" }}>
            {loading ? "Carregando…" : `${filtrados.length} de ${eventos.length} feira(s)`}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem", color: "#667085" }}>
          Carregando feiras…
        </div>
      ) : filtrados.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "2.5rem 1.5rem",
            borderStyle: "dashed",
            background: "#fafafa",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎪</div>
          <p style={{ margin: 0, fontWeight: 600, color: "#101828" }}>
            {eventos.length === 0 ? "Nenhuma feira cadastrada ainda" : "Nenhum resultado para a busca"}
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#667085", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            {isMaster
              ? "Comece criando uma nova feira. Depois adicione o mapa, os expositores e publique."
              : "Entre em contato com o administrador para criar feiras."}
          </p>
          {isMaster && eventos.length === 0 && (
            <Link to="/eventos/novo" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>
              Criar primeira feira
            </Link>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {filtrados.map((e) => {
            const noPeriodo = e.dataInicio <= hoje && e.dataFim >= hoje;
            const visivelApp = e.ativo && noPeriodo;
            const chipBg = visivelApp ? "#ecfdf3" : e.ativo ? "#fef3c7" : "#f2f4f7";
            const chipColor = visivelApp ? "#067647" : e.ativo ? "#b45309" : "#667085";
            const chipLabel = visivelApp ? "No app agora" : e.ativo ? "Ativo — fora do período" : "Inativo";

            return (
              <article
                key={e.id}
                className="card"
                style={{
                  marginBottom: 0,
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 14,
                  border: "1px solid #e4e7ec",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
                }}
              >
                <div
                  style={{
                    height: 120,
                    background: e.bannerUrl ? `url(${e.bannerUrl}) center/cover no-repeat` : "linear-gradient(120deg, #FF8C42 0%, #fdba74 100%)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: e.bannerUrl ? "linear-gradient(to top, rgba(0,0,0,0.45), transparent 55%)" : "none",
                    }}
                  />
                  {!e.bannerUrl && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.95)",
                        fontSize: "2rem",
                        fontWeight: 800,
                        textShadow: "0 1px 8px rgba(0,0,0,0.2)",
                      }}
                    >
                      🎪
                    </div>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.5rem",
                      borderRadius: 6,
                      background: chipBg,
                      color: chipColor,
                      border: "1px solid rgba(16,24,40,0.06)",
                    }}
                  >
                    {chipLabel}
                  </span>
                </div>

                <div style={{ padding: "1rem 1.1rem 1.1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "#101828", lineHeight: 1.3 }}>
                      {e.nome}
                    </h2>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.8125rem", color: "#667085" }}>
                      📍 {e.cidade}
                      {e.edicao ? ` · ${e.edicao}` : ""}
                      {e.categoria ? ` · ${e.categoria}` : ""}
                    </p>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "#475467" }}>
                    <span style={{ color: "#98a2b3" }}>Período</span>{" "}
                    {formatDateBR(e.dataInicio)} — {formatDateBR(e.dataFim)}
                    {e.exibirAPartir ? (
                      <span style={{ display: "block", marginTop: 4, fontSize: "0.75rem", color: "#667085" }}>
                        Divulgar a partir de {formatDateBR(e.exibirAPartir)}
                      </span>
                    ) : null}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#667085", fontWeight: 600 }}>Publicar</span>
                    <button
                      type="button"
                      className={`switch ${e.ativo ? "on" : ""}`}
                      title={e.ativo ? "Desativar" : "Ativar"}
                      onClick={() => handleToggleAtivo(e.id, e.ativo)}
                      aria-label={e.ativo ? "Desativar feira" : "Ativar feira"}
                    />
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "auto", paddingTop: "0.75rem" }}>
                    <Link to={`/eventos/${e.id}/editar`} className="btn btn-sm btn-secondary">
                      Editar
                    </Link>
                    <Link to={`/eventos/${e.id}/expositores`} className="btn btn-sm btn-secondary">
                      Expositores
                    </Link>
                    <Link to={`/eventos/${e.id}/mapa`} className="btn btn-sm btn-primary">
                      Mapa
                    </Link>
                    {isMaster && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(e.id, e.nome)}
                        style={{ marginLeft: "auto" }}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
