import { useState, useEffect } from "react";
import {
  getExpositorMe,
  updateExpositorMe,
  uploadExpositorImage,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ExpositorArea() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingTitulo, setUploadingTitulo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [form, setForm] = useState({ logoUrl: "", imagemTituloUrl: "", bannerUrl: "" });

  const load = () => {
    getExpositorMe()
      .then((d) => {
        setData(d);
        setForm({
          logoUrl: d.logoUrl || "",
          imagemTituloUrl: d.imagemTituloUrl || "",
          bannerUrl: d.bannerUrl || "",
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (field, tipo, file) => {
    if (!file?.type?.startsWith("image/")) {
      alert("Selecione uma imagem (JPG, PNG, etc.).");
      return;
    }
    const setters = { logoUrl: setUploadingLogo, imagemTituloUrl: setUploadingTitulo, bannerUrl: setUploadingBanner };
    setters[field](true);
    try {
      const res = await uploadExpositorImage(file, tipo);
      setForm((prev) => ({ ...prev, [field]: res.url }));
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao enviar imagem.");
    } finally {
      setters[field](false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateExpositorMe(form);
      alert("Imagens atualizadas com sucesso.");
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: "2rem", textAlign: "center" }}>Carregando...</div>;
  if (!data) return <div className="container">Erro ao carregar dados. <a href="/expositor/login">Fazer login novamente</a>.</div>;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          background: "#166534",
          color: "#fff",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>🏪 Área do Expositor</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.875rem" }}>{data.nome}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <main style={{ flex: 1, padding: "1.5rem", maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>Suas imagens</h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Faça upload da logo (aparece nos pins do mapa) e da imagem do título (cabeçalho da sua página no app).
        </p>
        <div className="card">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Logo (pins do mapa)</label>
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
                  if (f) handleUpload("logoUrl", "logo", f);
                  e.target.value = "";
                }}
                style={{ maxWidth: "100%" }}
              />
              {uploadingLogo && <span style={{ fontSize: "0.85rem", color: "#64748b" }}> Enviando...</span>}
            </div>
            <div className="form-group">
              <label>Imagem do título (cabeçalho da página no app)</label>
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
                  if (f) handleUpload("imagemTituloUrl", "titulo", f);
                  e.target.value = "";
                }}
                style={{ maxWidth: "100%" }}
              />
              {uploadingTitulo && <span style={{ fontSize: "0.85rem", color: "#64748b" }}> Enviando...</span>}
            </div>
            {data.patrocinado && (
              <div className="form-group">
                <label>Banner (patrocinador oficial no mapa)</label>
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
                    if (f) handleUpload("bannerUrl", "banner", f);
                    e.target.value = "";
                  }}
                  style={{ maxWidth: "100%" }}
                />
                {uploadingBanner && <span style={{ fontSize: "0.85rem", color: "#64748b" }}> Enviando...</span>}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: "1rem" }}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
