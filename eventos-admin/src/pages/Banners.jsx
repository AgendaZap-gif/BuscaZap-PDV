import { useState, useEffect, useRef } from "react";
import {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerAtivo,
  uploadEventoImage,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Banners() {
  const { user } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    page: "home",
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    position: "top",
    format: "horizontal",
    startDate: "",
    endDate: "",
  });

  const load = () => {
    setLoading(true);
    listBanners({ includeInactive: true })
      .then(setBanners)
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      page: "home",
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      position: "top",
      format: "horizontal",
      startDate: "",
      endDate: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (b) => {
    setEditingId(b.id);
    setForm({
      page: b.page || "home",
      title: b.title || "",
      description: b.description || "",
      imageUrl: b.imageUrl || "",
      linkUrl: b.linkUrl || "",
      position: b.position || "top",
      format: b.format || "horizontal",
      startDate: b.startDate ? String(b.startDate).slice(0, 10) : "",
      endDate: b.endDate ? String(b.endDate).slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.imageUrl?.trim()) {
      alert("Preencha título e imagem.");
      return;
    }
    try {
      if (editingId) {
        await updateBanner(editingId, {
          ...form,
          isActive: undefined,
        });
        alert("Banner atualizado!");
      } else {
        await createBanner(form);
        alert("Banner criado!");
      }
      resetForm();
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao salvar.");
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Excluir este banner?")) return;
    deleteBanner(id)
      .then(() => {
        load();
        if (editingId === id) resetForm();
      })
      .catch((err) => alert(err.response?.data?.error || "Erro ao excluir."));
  };

  const handleToggleAtivo = (id, ativo) => {
    toggleBannerAtivo(id, !ativo)
      .then(() => load())
      .catch((err) => alert(err.response?.data?.error || "Erro ao atualizar."));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) {
      alert("Selecione uma imagem (JPG, PNG, etc.).");
      return;
    }
    setUploading(true);
    uploadEventoImage(file, "banner", null)
      .then((data) => setForm((prev) => ({ ...prev, imageUrl: data.url })))
      .catch((err) => alert(err.response?.data?.error || "Erro no upload."))
      .finally(() => setUploading(false));
    e.target.value = "";
  };

  const isMaster = user?.role === "master";

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Banners publicitários</h1>
        {isMaster && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
          >
            {showForm ? "Cancelar" : "➕ Novo banner"}
          </button>
        )}
      </div>

      {showForm && isMaster && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? "Editar banner" : "Novo banner"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Título *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título do banner"
                required
              />
            </div>
            <div className="form-group">
              <label>Descrição (opcional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descrição"
                rows={2}
              />
            </div>
            <div className="form-group">
              <label>Imagem *</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Enviando..." : "Selecionar imagem"}
                </button>
                <input
                  type="url"
                  style={{ flex: 1, minWidth: 200 }}
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="URL da imagem"
                />
              </div>
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  style={{
                    marginTop: "0.5rem",
                    maxWidth: "100%",
                    maxHeight: 120,
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
              )}
            </div>
            <div className="form-group">
              <label>Link (opcional)</label>
              <input
                type="text"
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="https://... ou /rota"
              />
            </div>
            <div className="form-group">
              <label>Página</label>
              <select
                value={form.page}
                onChange={(e) => setForm((f) => ({ ...f, page: e.target.value }))}
              >
                <option value="home">Home</option>
                <option value="guia_comercial">Guia comercial</option>
              </select>
            </div>
            <div className="form-group">
              <label>Posição</label>
              <select
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              >
                <option value="top">Topo</option>
                <option value="middle">Meio</option>
                <option value="bottom">Rodapé</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Início (AAAA-MM-DD)</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Fim (AAAA-MM-DD)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Atualizar" : "Criar"} banner
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p>Carregando...</p>
        ) : banners.length === 0 ? (
          <p style={{ color: "#64748b" }}>Nenhum banner. {isMaster && 'Clique em "➕ Novo banner" para criar.'}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Título</th>
                <th>Página</th>
                <th>Ativo</th>
                <th>Período</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.imageUrl ? (
                      <img
                        src={b.imageUrl}
                        alt=""
                        style={{
                          width: 80,
                          height: 44,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td>{b.title || "—"}</td>
                  <td>{b.page === "guia_comercial" ? "Guia comercial" : "Home"}</td>
                  <td>
                    {isMaster ? (
                      <button
                        type="button"
                        className={`switch ${b.isActive ? "on" : ""}`}
                        title={b.isActive ? "Desativar" : "Ativar"}
                        onClick={() => handleToggleAtivo(b.id, b.isActive)}
                      />
                    ) : (
                      b.isActive ? "Sim" : "Não"
                    )}
                  </td>
                  <td>
                    {b.startDate || b.endDate
                      ? `${b.startDate || "—"} a ${b.endDate || "—"}`
                      : "—"}
                  </td>
                  <td>
                    {isMaster && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ marginRight: "0.5rem" }}
                          onClick={() => handleEdit(b)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: "#dc2626", color: "#fff" }}
                          onClick={() => handleDelete(b.id)}
                        >
                          Excluir
                        </button>
                      </>
                    )}
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
