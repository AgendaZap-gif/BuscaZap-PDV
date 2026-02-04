import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvento, createEvento, updateEvento } from "../services/api";
import QRCodeExport from "../components/QRCodeExport";

export default function EventoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cidade: "",
    dataInicio: "",
    dataFim: "",
    bannerUrl: "",
    mapaUrl: "",
    mapaLargura: 800,
    mapaAltura: 600,
    ativo: true,
  });

  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }
    getEvento(id)
      .then((e) => {
        setForm({
          nome: e.nome || "",
          cidade: e.cidade || "",
          dataInicio: e.dataInicio?.slice(0, 10) || "",
          dataFim: e.dataFim?.slice(0, 10) || "",
          bannerUrl: e.bannerUrl || "",
          mapaUrl: e.mapaUrl || "",
          mapaLargura: e.mapaLargura ?? 800,
          mapaAltura: e.mapaAltura ?? 600,
          ativo: e.ativo !== false,
        });
      })
      .catch(() => setForm((f) => f))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateEvento(id, form);
        alert("Evento atualizado.");
      } else {
        await createEvento(form);
        alert("Evento criado.");
      }
      navigate("/eventos");
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container">Carregando...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: "1rem" }}>{isEdit ? "Editar evento" : "Novo evento"}</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome *</label>
            <input
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              required
              placeholder="Ex: Feira Agro Primavera 2026"
            />
          </div>
          <div className="form-group">
            <label>Cidade *</label>
            <input
              value={form.cidade}
              onChange={(e) => handleChange("cidade", e.target.value)}
              required
              placeholder="Ex: Primavera do Leste"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Data início *</label>
              <input
                type="date"
                value={form.dataInicio}
                onChange={(e) => handleChange("dataInicio", e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Data fim *</label>
              <input
                type="date"
                value={form.dataFim}
                onChange={(e) => handleChange("dataFim", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>URL do banner</label>
            <input
              type="url"
              value={form.bannerUrl}
              onChange={(e) => handleChange("bannerUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label>URL do mapa (imagem)</label>
            <input
              type="url"
              value={form.mapaUrl}
              onChange={(e) => handleChange("mapaUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Largura do mapa (px)</label>
              <input
                type="number"
                min={100}
                value={form.mapaLargura}
                onChange={(e) => handleChange("mapaLargura", Number(e.target.value) || 800)}
              />
            </div>
            <div className="form-group">
              <label>Altura do mapa (px)</label>
              <input
                type="number"
                min={100}
                value={form.mapaAltura}
                onChange={(e) => handleChange("mapaAltura", Number(e.target.value) || 600)}
              />
            </div>
          </div>
          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              className={`switch ${form.ativo ? "on" : ""}`}
              onClick={() => handleChange("ativo", !form.ativo)}
            />
            <label style={{ margin: 0 }}>Evento ativo</label>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/eventos")}>
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {isEdit && (
        <div style={{ marginTop: "1.5rem" }}>
          <QRCodeExport eventoId={id} eventoNome={form.nome} />
        </div>
      )}
    </div>
  );
}
