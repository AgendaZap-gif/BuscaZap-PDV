import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getEvento, listExpositores, createExpositor, updateExpositor, uploadEventoImage } from "../services/api";

export default function ExpositorForm() {
  const navigate = useNavigate();
  const { eventoId, id } = useParams();
  const isEdit = Boolean(id);

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingTitulo, setUploadingTitulo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
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
    logoUrl: "",
    imagemTituloUrl: "",
    bannerUrl: "",
    login: "",
    senha: "",
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
          logoUrl: e.logoUrl || "",
          imagemTituloUrl: e.imagemTituloUrl || "",
          bannerUrl: e.bannerUrl || "",
          login: e.email || "",
          senha: "",
        });
      }
    });
  }, [eventoId, id, isEdit]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = async (field, tipo, file) => {
    if (!file?.type?.startsWith("image/")) {
      alert("Selecione uma imagem (JPG, PNG, etc.).");
      return;
    }
    const setters = { logoUrl: setUploadingLogo, imagemTituloUrl: setUploadingTitulo, bannerUrl: setUploadingBanner };
    setters[field](true);
    try {
      const data = await uploadEventoImage(file, tipo);
      setForm((prev) => ({ ...prev, [field]: data.url }));
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao enviar imagem.");
    } finally {
      setters[field](false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        posX: Number(form.posX) || 0,
        posY: Number(form.posY) || 0,
        email: form.login?.trim() || null,
      };
      delete payload.login;
      if (isEdit && payload.senha === "") delete payload.senha;
      if (isEdit) {
        await updateExpositor(id, payload);
        alert("Expositor atualizado.");
      } else {
        if (!payload.senha) delete payload.senha;
        if (!payload.email) delete payload.email;
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

          <hr style={{ margin: "1.25rem 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Imagens (upload pela empresa ou pelo admin)</h3>
          <div className="form-group">
            <label>Logo (aparece nos pins do mapa)</label>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>Imagem que aparece no pin da empresa no mapa da feira.</p>
            {form.logoUrl && (
              <div style={{ marginBottom: "0.5rem" }}>
                <img src={form.logoUrl} alt="Logo" style={{ maxWidth: 80, maxHeight: 80, objectFit: "contain", borderRadius: 8, border: "1px solid #e2e8f0" }} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={uploadingLogo}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload("logoUrl", "expositor-logo", f);
                e.target.value = "";
              }}
              style={{ maxWidth: "280px" }}
            />
            {uploadingLogo && <span style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: "0.5rem" }}>Enviando...</span>}
          </div>
          <div className="form-group">
            <label>Imagem do título (cabeçalho da página no app)</label>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>Quando o usuário clica no pin, esta imagem aparece no topo da página da empresa.</p>
            {form.imagemTituloUrl && (
              <div style={{ marginBottom: "0.5rem" }}>
                <img src={form.imagemTituloUrl} alt="Título" style={{ maxWidth: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={uploadingTitulo}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload("imagemTituloUrl", "expositor-titulo", f);
                e.target.value = "";
              }}
              style={{ maxWidth: "280px" }}
            />
            {uploadingTitulo && <span style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: "0.5rem" }}>Enviando...</span>}
          </div>
          {form.patrocinado && (
            <div className="form-group">
              <label>Banner (patrocinador oficial no mapa da feira)</label>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>Banner do patrocinador oficial exibido acima do mapa no app. Upload pelo BuscaZap/admin.</p>
              {form.bannerUrl && (
                <div style={{ marginBottom: "0.5rem" }}>
                  <img src={form.bannerUrl} alt="Banner" style={{ maxWidth: "100%", maxHeight: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingBanner}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload("bannerUrl", "expositor-banner", f);
                  e.target.value = "";
                }}
                style={{ maxWidth: "280px" }}
              />
              {uploadingBanner && <span style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: "0.5rem" }}>Enviando...</span>}
            </div>
          )}

          <hr style={{ margin: "1.25rem 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Acesso do expositor (área própria)</h3>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem" }}>Com login e senha o expositor pode acessar a área dele e fazer upload das próprias imagens (logo e título).</p>
          <div className="form-row">
            <div className="form-group">
              <label>Email (login do expositor)</label>
              <input
                type="email"
                value={form.login}
                onChange={(e) => handleChange("login", e.target.value)}
                placeholder="ex: empresa@email.com"
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>{isEdit ? "Nova senha (deixe em branco para não alterar)" : "Senha"}</label>
              <input
                type="password"
                value={form.senha}
                onChange={(e) => handleChange("senha", e.target.value)}
                placeholder={isEdit ? "••••••••" : "Mín. 6 caracteres"}
                autoComplete={isEdit ? "new-password" : "new-password"}
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
