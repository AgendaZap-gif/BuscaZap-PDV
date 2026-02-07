import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getEvento, listExpositores, createExpositor, updateExpositor } from "../services/api";

export default function ExpositorForm() {
  const navigate = useNavigate();
  const { eventoId, id } = useParams();
  const isEdit = Boolean(id);

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    categoria: "",
    whatsapp: "",
    estande: "",
    promocao: "",
    destaque: false,
    patrocinado: false,
    posX: 0,
    posY: 0,
  });

  useEffect(() => {
    getEvento(eventoId)
      .then(setEvento)
      .catch(() => setEvento(null))
      .finally(() => setLoading(false));
  }, [eventoId]);

  useEffect(() => {
    if (!isEdit) return;
    listExpositores(eventoId).then((list) => {
      const e = list.find((x) => String(x.id) === id);
      if (e) {
        setForm({
          nome: e.nome || "",
          categoria: e.categoria || "",
          whatsapp: e.whatsapp || "",
          estande: e.estande || "",
          promocao: e.promocao || "",
          destaque: Boolean(e.destaque),
          patrocinado: Boolean(e.patrocinado),
          posX: e.posX ?? 0,
          posY: e.posY ?? 0,
        });
      }
    });
  }, [eventoId, id, isEdit]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        posX: Number(form.posX) || 0,
        posY: Number(form.posY) || 0,
      };
      if (isEdit) {
        await updateExpositor(id, payload);
        alert("Expositor atualizado.");
      } else {
        await createExpositor(eventoId, payload);
        alert("Expositor criado. Use o Editor de mapa para posicionar no mapa.");
      }
      navigate(`/eventos/${eventoId}/expositores`);
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !evento) return <div className="container">Carregando...</div>;

  return (
    <div className="container">
      <div style={{ marginBottom: "1rem" }}>
        <Link to={`/eventos/${eventoId}/expositores`} style={{ color: "#64748b", fontSize: "0.875rem" }}>
          ← Expositores — {evento.nome}
        </Link>
        <h1 style={{ margin: "0.25rem 0" }}>{isEdit ? "Editar expositor" : "Novo expositor"}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome *</label>
            <input
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              required
              placeholder="Ex: Trator Sul"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Categoria</label>
              <input
                value={form.categoria}
                onChange={(e) => handleChange("categoria", e.target.value)}
                placeholder="Ex: Máquinas"
              />
            </div>
            <div className="form-group">
              <label>Estande</label>
              <input
                value={form.estande}
                onChange={(e) => handleChange("estande", e.target.value)}
                placeholder="Ex: A12"
              />
            </div>
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input
              value={form.whatsapp}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="5566999999999"
            />
          </div>
          <div className="form-group">
            <label>Promoção</label>
            <input
              value={form.promocao}
              onChange={(e) => handleChange("promocao", e.target.value)}
              placeholder="Ex: 10% OFF"
            />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="destaque"
                checked={form.destaque}
                onChange={(e) => handleChange("destaque", e.target.checked)}
              />
              <label htmlFor="destaque" style={{ margin: 0 }}>Destaque</label>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="patrocinado"
                checked={form.patrocinado}
                onChange={(e) => handleChange("patrocinado", e.target.checked)}
              />
              <label htmlFor="patrocinado" style={{ margin: 0 }}>Patrocinado</label>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Posição X (no mapa)</label>
              <input
                type="number"
                min={0}
                value={form.posX}
                onChange={(e) => handleChange("posX", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Posição Y (no mapa)</label>
              <input
                type="number"
                min={0}
                value={form.posY}
                onChange={(e) => handleChange("posY", e.target.value)}
              />
            </div>
          </div>
          <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Dica: use o <Link to={`/eventos/${eventoId}/mapa`}>Editor de mapa</Link> para clicar e definir a posição automaticamente.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(`/eventos/${eventoId}/expositores`)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
