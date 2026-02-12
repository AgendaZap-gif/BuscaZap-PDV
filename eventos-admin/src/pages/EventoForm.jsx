import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getEvento,
  createEvento,
  updateEvento,
  uploadEventoImage,
  listBannerImagens,
  deleteBannerImagem,
  uploadBannerImagensBulk,
  listQuestionarioPerguntas,
  createQuestionarioPergunta,
  updateQuestionarioPergunta,
  deleteQuestionarioPergunta,
} from "../services/api";
import QRCodeExport from "../components/QRCodeExport";

export default function EventoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingMapa, setUploadingMapa] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cidade: "",
    dataInicio: "",
    dataFim: "",
    exibirAPartir: "", // opcional: data a partir da qual exibir no app (divulgação antecipada)
    bannerUrl: "",
    mapaUrl: "",
    mapaLargura: 800,
    mapaAltura: 600,
    ativo: true,
  });
  const [anexoBannerId, setAnexoBannerId] = useState(null);
  const [anexoMapaId, setAnexoMapaId] = useState(null);
  const [bannerImagens, setBannerImagens] = useState([]);
  const [uploadingBanners, setUploadingBanners] = useState(false);
  const [questionarioPerguntas, setQuestionarioPerguntas] = useState([]);
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);
  const [editingPerguntaId, setEditingPerguntaId] = useState(null);
  const [novaPergunta, setNovaPergunta] = useState({ pergunta: "", opcoes: "" });

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
          exibirAPartir: e.exibirAPartir ? String(e.exibirAPartir).slice(0, 10) : "",
          bannerUrl: e.bannerUrl || "",
          mapaUrl: e.mapaUrl || "",
          mapaLargura: e.mapaLargura ?? 800,
          mapaAltura: e.mapaAltura ?? 600,
          ativo: e.ativo !== false,
        });
        setBannerImagens(e.bannerImagens || []);
      })
      .catch(() => setForm((f) => f))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingPerguntas(true);
    listQuestionarioPerguntas(id)
      .then(setQuestionarioPerguntas)
      .catch(() => setQuestionarioPerguntas([]))
      .finally(() => setLoadingPerguntas(false));
  }, [id, isEdit]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = async (field, file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Selecione uma imagem (JPG, PNG, etc.).");
      return;
    }
    const tipo = field === "bannerUrl" ? "banner" : "mapa";
    const setUploading = field === "bannerUrl" ? setUploadingBanner : setUploadingMapa;
    setUploading(true);
    try {
      const eventoId = isEdit ? id : null;
      const data = await uploadEventoImage(file, tipo, eventoId);
      setForm((prev) => ({ ...prev, [field]: data.url }));
      if (data.anexoId) {
        if (field === "bannerUrl") setAnexoBannerId(data.anexoId);
        else setAnexoMapaId(data.anexoId);
      } else {
        if (field === "bannerUrl") setAnexoBannerId(null);
        else setAnexoMapaId(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleBannerImagensUpload = async (files) => {
    if (!isEdit || !id || !files?.length) return;
    const imageFiles = Array.from(files).filter((f) => f.type?.startsWith("image/"));
    if (!imageFiles.length) {
      alert("Selecione apenas imagens (JPG, PNG, etc.).");
      return;
    }
    setUploadingBanners(true);
    try {
      await uploadBannerImagensBulk(id, imageFiles);
      const list = await listBannerImagens(id);
      setBannerImagens(list);
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao enviar imagens.");
    } finally {
      setUploadingBanners(false);
    }
  };

  const handleRemoveBannerImagem = async (imageId) => {
    if (!isEdit || !id) return;
    if (!confirm("Remover esta imagem do carrossel?")) return;
    try {
      await deleteBannerImagem(id, imageId);
      setBannerImagens((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao remover.");
    }
  };

  const opcoesFromString = (s) =>
    (s || "")
      .split(/[\n,]+/)
      .map((o) => o.trim())
      .filter(Boolean);
  const opcoesToString = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");

  const handleAddPergunta = async () => {
    if (!id || !novaPergunta.pergunta.trim()) {
      alert("Digite a pergunta.");
      return;
    }
    const opcoes = opcoesFromString(novaPergunta.opcoes);
    if (opcoes.length === 0) {
      alert("Informe ao menos uma opção (uma por linha ou separadas por vírgula).");
      return;
    }
    try {
      const created = await createQuestionarioPergunta(id, {
        pergunta: novaPergunta.pergunta.trim(),
        opcoes,
      });
      setQuestionarioPerguntas((prev) => [...prev, created].sort((a, b) => a.ordem - b.ordem));
      setNovaPergunta({ pergunta: "", opcoes: "" });
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao adicionar pergunta.");
    }
  };

  const handleSavePergunta = async (perguntaId, pergunta, opcoes) => {
    if (!id) return;
    const opcoesArr = Array.isArray(opcoes) ? opcoes : opcoesFromString(opcoes);
    if (opcoesArr.length === 0) {
      alert("Informe ao menos uma opção.");
      return;
    }
    try {
      const updated = await updateQuestionarioPergunta(id, perguntaId, {
        pergunta: (pergunta || "").trim(),
        opcoes: opcoesArr,
      });
      setQuestionarioPerguntas((prev) =>
        prev.map((p) => (p.id === perguntaId ? updated : p))
      );
      setEditingPerguntaId(null);
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao salvar pergunta.");
    }
  };

  const handleDeletePergunta = async (perguntaId) => {
    if (!id) return;
    if (!confirm("Remover esta pergunta da pesquisa?")) return;
    try {
      await deleteQuestionarioPergunta(id, perguntaId);
      setQuestionarioPerguntas((prev) => prev.filter((p) => p.id !== perguntaId));
      setEditingPerguntaId(null);
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao remover.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateEvento(id, form);
        alert("Evento atualizado.");
      } else {
        const payload = { ...form };
        if (anexoBannerId) payload.anexoBannerId = anexoBannerId;
        if (anexoMapaId) payload.anexoMapaId = anexoMapaId;
        await createEvento(payload);
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
            <label>Exibir no app a partir de</label>
            <input
              type="date"
              value={form.exibirAPartir}
              onChange={(e) => handleChange("exibirAPartir", e.target.value)}
              placeholder="Opcional"
            />
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.35rem", marginBottom: 0 }}>
              Opcional. Preencha para divulgar a feira no app antes do início (ex.: 7 dias antes). Deixe em branco para exibir só no período do evento.
            </p>
          </div>
          <div className="form-group">
            <label>Banner (principal)</label>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
              URL do banner principal ou envie uma imagem. O app pode exibir também o carrossel abaixo.
            </p>
            <input
              type="url"
              value={form.bannerUrl}
              onChange={(e) => handleChange("bannerUrl", e.target.value)}
              placeholder="https://..."
              style={{ marginBottom: "0.5rem" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <label style={{ margin: 0, fontWeight: "normal", fontSize: "0.9rem" }}>Ou envie uma imagem:</label>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingBanner}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload("bannerUrl", f);
                  e.target.value = "";
                }}
                style={{ maxWidth: "280px" }}
              />
              {uploadingBanner && <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Enviando...</span>}
            </div>
            {form.bannerUrl && (
              <p style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                <a href={form.bannerUrl} target="_blank" rel="noopener noreferrer">Ver imagem atual</a>
              </p>
            )}
          </div>
          {isEdit && (
            <div className="form-group">
              <label>Carrossel do banner (várias imagens)</label>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
                Adicione várias imagens para o carrossel na página do evento. Ordem: da esquerda para a direita.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
                {bannerImagens.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      position: "relative",
                      width: 120,
                      height: 80,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={img.url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBannerImagem(img.id)}
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 14,
                        lineHeight: 1,
                        padding: 0,
                      }}
                      title="Remover"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingBanners}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files?.length) {
                      handleBannerImagensUpload(files);
                      e.target.value = "";
                    }
                  }}
                  style={{ maxWidth: "320px" }}
                />
                {uploadingBanners && (
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Enviando...</span>
                )}
              </div>
              {bannerImagens.length > 0 && (
                <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                  {bannerImagens.length} imagem(ns) no carrossel
                </p>
              )}
            </div>
          )}
          <div className="form-group">
            <label>Mapa (imagem)</label>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
              Use o link (URL) ou envie uma imagem do mapa.
            </p>
            <input
              type="url"
              value={form.mapaUrl}
              onChange={(e) => handleChange("mapaUrl", e.target.value)}
              placeholder="https://..."
              style={{ marginBottom: "0.5rem" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <label style={{ margin: 0, fontWeight: "normal", fontSize: "0.9rem" }}>Ou envie uma imagem:</label>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingMapa}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload("mapaUrl", f);
                  e.target.value = "";
                }}
                style={{ maxWidth: "280px" }}
              />
              {uploadingMapa && <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Enviando...</span>}
            </div>
            {form.mapaUrl && (
              <p style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                <a href={form.mapaUrl} target="_blank" rel="noopener noreferrer">Ver imagem atual</a>
              </p>
            )}
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

          {isEdit && (
            <div className="form-group" style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
              <label>Pesquisa rápida (questionário)</label>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem" }}>
                Perguntas que o visitante responde uma vez por dia para acessar o mapa, promoções e área social. Se não definir nenhuma, o app usa a pesquisa fixa (ex.: visitante/estudante, cidade). Adicione perguntas com múltipla escolha.
              </p>
              {loadingPerguntas ? (
                <p style={{ fontSize: "0.9rem", color: "#64748b" }}>Carregando perguntas...</p>
              ) : (
                <>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem 0" }}>
                    {questionarioPerguntas.map((p) => (
                      <li
                        key={p.id}
                        style={{
                          marginBottom: "0.75rem",
                          padding: "0.75rem",
                          background: "#f8fafc",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {editingPerguntaId === p.id ? (
                          <div>
                            <input
                              type="text"
                              defaultValue={p.pergunta}
                              id={`edit-pergunta-${p.id}`}
                              placeholder="Texto da pergunta"
                              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.35rem 0.5rem" }}
                            />
                            <textarea
                              id={`edit-opcoes-${p.id}`}
                              defaultValue={opcoesToString(p.opcoes)}
                              placeholder="Uma opção por linha"
                              rows={2}
                              style={{ width: "100%", marginBottom: "0.5rem", padding: "0.35rem 0.5rem", resize: "vertical" }}
                            />
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button type="button" className="btn btn-primary" onClick={() => handleSavePergunta(p.id, document.getElementById(`edit-pergunta-${p.id}`)?.value, document.getElementById(`edit-opcoes-${p.id}`)?.value)}>
                                Salvar
                              </button>
                              <button type="button" className="btn btn-secondary" onClick={() => setEditingPerguntaId(null)}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div>
                              <strong>{p.pergunta}</strong>
                              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                                {Array.isArray(p.opcoes) ? p.opcoes.join(" · ") : opcoesToString(p.opcoes)}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.35rem" }}>
                              <button type="button" className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }} onClick={() => setEditingPerguntaId(p.id)}>
                                Editar
                              </button>
                              <button type="button" className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }} onClick={() => handleDeletePergunta(p.id)}>
                                Excluir
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: "0.5rem" }}>
                    <input
                      type="text"
                      value={novaPergunta.pergunta}
                      onChange={(e) => setNovaPergunta((prev) => ({ ...prev, pergunta: e.target.value }))}
                      placeholder="Nova pergunta (ex.: Você é?)"
                      style={{ width: "100%", marginBottom: "0.35rem", padding: "0.35rem 0.5rem" }}
                    />
                    <textarea
                      value={novaPergunta.opcoes}
                      onChange={(e) => setNovaPergunta((prev) => ({ ...prev, opcoes: e.target.value }))}
                      placeholder="Opções, uma por linha (ex.: Visitante&#10;Estudante)"
                      rows={2}
                      style={{ width: "100%", marginBottom: "0.35rem", padding: "0.35rem 0.5rem", resize: "vertical" }}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleAddPergunta}>
                      Adicionar pergunta
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

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
