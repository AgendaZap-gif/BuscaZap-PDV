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

const CATEGORIAS = ["Agro", "Shows", "Esportes", "Negócios", "Tecnologia", "Cultura", "Gastronomia", "Educação", "Saúde", "Outros"];

const TABS = [
  { id: "info", label: "📋 Informações Gerais" },
  { id: "midia", label: "🖼️ Mídia & Imagens" },
  { id: "estatisticas", label: "📊 Estatísticas" },
  { id: "contato", label: "📞 Contato & Redes" },
  { id: "programacao", label: "🗓️ Programação" },
  { id: "expositor", label: "🏪 Expositor" },
  { id: "pesquisa", label: "📝 Pesquisa" },
  { id: "qrcode", label: "📱 QR Code" },
];

const S = {
  section: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: 12,
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    fontWeight: 600,
    fontSize: "0.8125rem",
    color: "#344054",
    marginBottom: "0.35rem",
  },
  input: {
    width: "100%",
    padding: "0.55rem 0.875rem",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    background: "#fff",
    color: "#101828",
    fontSize: "0.875rem",
    boxSizing: "border-box",
    outline: "none",
  },
  hint: { fontSize: "0.75rem", color: "#667085", marginTop: "0.3rem" },
  btnPrimary: {
    padding: "0.65rem 1.5rem",
    background: "#FF8C42",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: "0.9375rem",
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "0.65rem 1.25rem",
    background: "#fff",
    color: "#344054",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" },
};

export default function EventoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingMapa, setUploadingMapa] = useState(false);
  const [uploadingBanners, setUploadingBanners] = useState(false);

  const [form, setForm] = useState({
    nome: "", cidade: "", edicao: "", descricao: "", categoria: "Agro",
    dataInicio: "", dataFim: "", exibirAPartir: "", ativo: true,
    bannerUrl: "", mapaUrl: "", mapaLargura: 800, mapaAltura: 600,
    numVisitantes: "", numExpositores: "",
    whatsappOrganizador: "", emailOrganizador: "", siteOficial: "",
    instagram: "", facebook: "", youtube: "",
    ingressoUrl: "", precoEntrada: "",
    programacao: [],
    expositorContato: "", expositorContatoTipo: "whatsapp",
  });

  const [anexoBannerId, setAnexoBannerId] = useState(null);
  const [anexoMapaId, setAnexoMapaId] = useState(null);
  const [bannerImagens, setBannerImagens] = useState([]);
  const [novoProg, setNovoProg] = useState({ dia: "", horario: "", titulo: "", local: "" });
  const [editingProgIdx, setEditingProgIdx] = useState(null);
  const [questionarioPerguntas, setQuestionarioPerguntas] = useState([]);
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);
  const [editingPerguntaId, setEditingPerguntaId] = useState(null);
  const [novaPergunta, setNovaPergunta] = useState({ pergunta: "", opcoes: "" });

  useEffect(() => {
    if (!isEdit) { setLoading(false); return; }
    const loadData = async () => {
      try {
        const e = await getEvento(id);
        let prog = [];
        try { prog = e.programacao ? (typeof e.programacao === "string" ? JSON.parse(e.programacao) : e.programacao) : []; if (!Array.isArray(prog)) prog = []; } catch { prog = []; }
        setForm({
          nome: e.nome || "", cidade: e.cidade || "", edicao: e.edicao || "",
          descricao: e.descricao || "", categoria: e.categoria || "Agro",
          dataInicio: e.dataInicio?.slice(0, 10) || "", dataFim: e.dataFim?.slice(0, 10) || "",
          exibirAPartir: e.exibirAPartir ? String(e.exibirAPartir).slice(0, 10) : "",
          ativo: e.ativo !== false,
          bannerUrl: e.bannerUrl || "", mapaUrl: e.mapaUrl || "",
          mapaLargura: e.mapaLargura ?? 800, mapaAltura: e.mapaAltura ?? 600,
          numVisitantes: e.numVisitantes || "", numExpositores: e.numExpositores || "",
          whatsappOrganizador: e.whatsappOrganizador || "", emailOrganizador: e.emailOrganizador || "",
          siteOficial: e.siteOficial || "", instagram: e.instagram || "",
          facebook: e.facebook || "", youtube: e.youtube || "",
          ingressoUrl: e.ingressoUrl || "", precoEntrada: e.precoEntrada || "",
          programacao: prog,
          expositorContato: e.expositorContato || "", expositorContatoTipo: e.expositorContatoTipo || "whatsapp",
        });
        
        // Buscar imagens do carrossel separadamente para garantir que estão atualizadas
        const imgs = await listBannerImagens(id);
        setBannerImagens(imgs || []);
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingPerguntas(true);
    listQuestionarioPerguntas(id).then(setQuestionarioPerguntas).catch(() => setQuestionarioPerguntas([])).finally(() => setLoadingPerguntas(false));
  }, [id, isEdit]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleUpload = async (field, file) => {
    if (!file?.type?.startsWith("image/")) { alert("Selecione uma imagem."); return; }
    const tipo = field === "bannerUrl" ? "banner" : "mapa";
    const setU = field === "bannerUrl" ? setUploadingBanner : setUploadingMapa;
    setU(true);
    try {
      const data = await uploadEventoImage(file, tipo, isEdit ? id : null);
      set(field, data.url);
      if (data.anexoId) {
        if (field === "bannerUrl") setAnexoBannerId(data.anexoId);
        else setAnexoMapaId(data.anexoId);
      }
    } catch (err) { alert(err.response?.data?.error || "Erro ao enviar imagem."); }
    finally { setU(false); }
  };

  const handleBannerBulk = async (files) => {
    if (!isEdit || !id || !files?.length) return;
    const imgs = Array.from(files).filter((f) => f.type?.startsWith("image/"));
    if (!imgs.length) { alert("Selecione apenas imagens."); return; }
    setUploadingBanners(true);
    try {
      await uploadBannerImagensBulk(id, imgs);
      setBannerImagens(await listBannerImagens(id));
    } catch (err) { alert(err.response?.data?.error || "Erro ao enviar."); }
    finally { setUploadingBanners(false); }
  };

  const handleRemoveBanner = async (imageId) => {
    if (!isEdit || !id || !confirm("Remover esta imagem?")) return;
    try { await deleteBannerImagem(id, imageId); setBannerImagens((p) => p.filter((i) => i.id !== imageId)); }
    catch (err) { alert(err.response?.data?.error || "Erro ao remover."); }
  };

  const addProg = () => {
    if (!novoProg.titulo.trim()) { alert("Informe o título."); return; }
    setForm((p) => ({ ...p, programacao: [...p.programacao, { ...novoProg }] }));
    setNovoProg({ dia: "", horario: "", titulo: "", local: "" });
  };
  const removeProg = (idx) => setForm((p) => ({ ...p, programacao: p.programacao.filter((_, i) => i !== idx) }));
  const editProg = (idx, field, value) => setForm((p) => { const a = [...p.programacao]; a[idx] = { ...a[idx], [field]: value }; return { ...p, programacao: a }; });

  const opcoesFromStr = (s) => (s || "").split(/[\n,]+/).map((o) => o.trim()).filter(Boolean);
  const opcoesToStr = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");

  const addPergunta = async () => {
    if (!id || !novaPergunta.pergunta.trim()) { alert("Digite a pergunta."); return; }
    const opcoes = opcoesFromStr(novaPergunta.opcoes);
    if (!opcoes.length) { alert("Informe ao menos uma opção."); return; }
    try {
      const c = await createQuestionarioPergunta(id, { pergunta: novaPergunta.pergunta.trim(), opcoes });
      setQuestionarioPerguntas((p) => [...p, c].sort((a, b) => a.ordem - b.ordem));
      setNovaPergunta({ pergunta: "", opcoes: "" });
    } catch (err) { alert(err.response?.data?.error || "Erro."); }
  };

  const savePergunta = async (pid, pergunta, opcoes) => {
    const arr = Array.isArray(opcoes) ? opcoes : opcoesFromStr(opcoes);
    if (!arr.length) { alert("Informe ao menos uma opção."); return; }
    try {
      const u = await updateQuestionarioPergunta(id, pid, { pergunta: (pergunta || "").trim(), opcoes: arr });
      setQuestionarioPerguntas((p) => p.map((x) => (x.id === pid ? u : x)));
      setEditingPerguntaId(null);
    } catch (err) { alert(err.response?.data?.error || "Erro."); }
  };

  const deletePergunta = async (pid) => {
    if (!confirm("Remover esta pergunta?")) return;
    try { await deleteQuestionarioPergunta(id, pid); setQuestionarioPerguntas((p) => p.filter((x) => x.id !== pid)); setEditingPerguntaId(null); }
    catch (err) { alert(err.response?.data?.error || "Erro."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!isEdit) {
        const payloadPost = { ...payload };
        if (anexoBannerId) payloadPost.anexoBannerId = anexoBannerId;
        if (anexoMapaId) payloadPost.anexoMapaId = anexoMapaId;
        await createEvento(payloadPost);
        alert("Evento criado com sucesso!");
      } else {
        await updateEvento(id, payload);
        alert("Evento atualizado com sucesso!");
      }
      navigate("/eventos");
    } catch (err) { alert(err.response?.data?.error || "Erro ao salvar."); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#667085" }}>Carregando...</div>;

  const SaveBtn = () => (
    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
      <button type="submit" disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
        {saving ? "Salvando..." : isEdit ? "💾 Salvar alterações" : "✅ Criar evento"}
      </button>
      <button type="button" onClick={() => navigate("/eventos")} style={S.btnSecondary}>Cancelar</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 800, color: "#101828" }}>
            {isEdit ? "✏️ Editar evento" : "➕ Novo evento"}
          </h1>
          {isEdit && form.nome && <p style={{ margin: "0.2rem 0 0", fontSize: "0.875rem", color: "#667085" }}>{form.nome}</p>}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, padding: "0.4rem 0.75rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "#344054", fontWeight: 600 }}>Ativo</span>
            <button type="button" onClick={() => set("ativo", !form.ativo)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: form.ativo ? "#FF8C42" : "#d0d5dd", position: "relative", padding: 0 }}>
              <span style={{ position: "absolute", width: 18, height: 18, borderRadius: "50%", background: "#fff", top: 3, left: form.ativo ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
            </button>
          </div>
          <button type="button" onClick={() => navigate("/eventos")} style={{ ...S.btnSecondary, padding: "0.4rem 0.875rem", fontSize: "0.8125rem" }}>← Voltar</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #e4e7ec", marginBottom: "1.5rem", overflowX: "auto" }}>
        {TABS.map((tab) => (
          (!isEdit && (tab.id === "pesquisa" || tab.id === "qrcode")) ? null : (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{
              padding: "0.6rem 1rem", border: "none", background: "transparent",
              color: activeTab === tab.id ? "#FF8C42" : "#667085",
              fontWeight: activeTab === tab.id ? 700 : 500, fontSize: "0.8125rem", cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid #FF8C42" : "2px solid transparent",
              marginBottom: -2, whiteSpace: "nowrap",
            }}>
              {tab.label}
            </button>
          )
        ))}
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── TAB: INFORMAÇÕES GERAIS ─────────────────────────────── */}
        {activeTab === "info" && (
          <>
            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem", color: "#101828" }}>Dados do Evento</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label}>Nome do evento *</label>
                  <input style={S.input} value={form.nome} onChange={(e) => set("nome", e.target.value)} required placeholder="Ex: Farm Show MT 2026" />
                </div>
                <div>
                  <label style={S.label}>Cidade *</label>
                  <input style={S.input} value={form.cidade} onChange={(e) => set("cidade", e.target.value)} required placeholder="Ex: Primavera do Leste - MT" />
                </div>
                <div>
                  <label style={S.label}>Edição</label>
                  <input style={S.input} value={form.edicao} onChange={(e) => set("edicao", e.target.value)} placeholder="Ex: 10ª Edição" />
                  <p style={S.hint}>Exibido no badge: "10ª EDIÇÃO • FARM SHOW MT"</p>
                </div>
                <div>
                  <label style={S.label}>Categoria</label>
                  <select style={S.input} value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
                    {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label}>Descrição</label>
                  <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }} value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Descrição completa do evento..." rows={3} />
                </div>
              </div>
            </div>

            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem", color: "#101828" }}>Datas</div>
              <div style={S.grid3}>
                <div>
                  <label style={S.label}>Data de início *</label>
                  <input type="date" style={S.input} value={form.dataInicio} onChange={(e) => set("dataInicio", e.target.value)} required />
                </div>
                <div>
                  <label style={S.label}>Data de fim *</label>
                  <input type="date" style={S.input} value={form.dataFim} onChange={(e) => set("dataFim", e.target.value)} required />
                </div>
                <div>
                  <label style={S.label}>Exibir a partir de</label>
                  <input type="date" style={S.input} value={form.exibirAPartir} onChange={(e) => set("exibirAPartir", e.target.value)} />
                  <p style={S.hint}>Início da divulgação antecipada no app</p>
                </div>
              </div>
            </div>

            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem", color: "#101828" }}>Localização (opcional)</div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Latitude</label>
                  <input type="number" step="any" style={S.input} value={form.latitude || ""} onChange={(e) => set("latitude", e.target.value)} placeholder="-15.5563" />
                </div>
                <div>
                  <label style={S.label}>Longitude</label>
                  <input type="number" step="any" style={S.input} value={form.longitude || ""} onChange={(e) => set("longitude", e.target.value)} placeholder="-54.3432" />
                </div>
              </div>
            </div>
            <SaveBtn />
          </>
        )}

        {/* ── TAB: MÍDIA & IMAGENS ────────────────────────────────── */}
        {activeTab === "midia" && (
          <>
            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "#101828" }}>🖼️ Banner Principal</div>
              <p style={{ ...S.hint, marginBottom: "0.75rem" }}>Imagem principal do evento (recomendado: 1200×500px)</p>
              {form.bannerUrl && (
                <div style={{ marginBottom: "0.75rem", borderRadius: 8, overflow: "hidden", border: "1px solid #e4e7ec", maxHeight: 200 }}>
                  <img src={form.bannerUrl} alt="Banner" style={{ width: "100%", height: 200, objectFit: "cover" }} />
                </div>
              )}
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ padding: "0.55rem 1rem", background: "#FF8C42", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  {uploadingBanner ? "Enviando..." : "📤 Enviar imagem"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleUpload("bannerUrl", e.target.files[0])} />
                </label>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <input style={S.input} value={form.bannerUrl} onChange={(e) => set("bannerUrl", e.target.value)} placeholder="Ou cole a URL da imagem" />
                </div>
              </div>
            </div>

            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "#101828" }}>🗺️ Mapa dos Estandes</div>
              <p style={{ ...S.hint, marginBottom: "0.75rem" }}>Imagem do mapa interativo (recomendado: 1600×1200px)</p>
              {form.mapaUrl && (
                <div style={{ marginBottom: "0.75rem", borderRadius: 8, overflow: "hidden", border: "1px solid #e4e7ec", maxHeight: 200 }}>
                  <img src={form.mapaUrl} alt="Mapa" style={{ width: "100%", height: 200, objectFit: "contain", background: "#f8f9fb" }} />
                </div>
              )}
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                <label style={{ padding: "0.55rem 1rem", background: "#FF8C42", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  {uploadingMapa ? "Enviando..." : "📤 Enviar mapa"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleUpload("mapaUrl", e.target.files[0])} />
                </label>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <input style={S.input} value={form.mapaUrl} onChange={(e) => set("mapaUrl", e.target.value)} placeholder="Ou cole a URL do mapa" />
                </div>
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Largura do mapa (px)</label>
                  <input type="number" style={S.input} value={form.mapaLargura} onChange={(e) => set("mapaLargura", Number(e.target.value))} min={100} />
                </div>
                <div>
                  <label style={S.label}>Altura do mapa (px)</label>
                  <input type="number" style={S.input} value={form.mapaAltura} onChange={(e) => set("mapaAltura", Number(e.target.value))} min={100} />
                </div>
              </div>
            </div>

            {isEdit && (
              <div style={S.section}>
                <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "#101828" }}>🎠 Carrossel de Banners (Home)</div>
                <p style={{ ...S.hint, marginBottom: "1rem" }}>Imagens exibidas no carrossel da tela inicial do app.</p>
                {bannerImagens.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                    {bannerImagens.map((img) => (
                      <div key={img.id} style={{ position: "relative", width: 130, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid #e4e7ec" }}>
                        <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button type="button" onClick={() => handleRemoveBanner(img.id)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(16,24,40,0.65)", color: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                        <div style={{ position: "absolute", bottom: 2, left: 4, fontSize: "0.6rem", color: "#fff", background: "rgba(0,0,0,0.5)", borderRadius: 3, padding: "0 3px" }}>#{img.ordem}</div>
                      </div>
                    ))}
                  </div>
                )}
                <label style={{ padding: "0.55rem 1rem", background: "#FF8C42", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  {uploadingBanners ? "Enviando..." : "📤 Adicionar imagens ao carrossel"}
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => e.target.files?.length && handleBannerBulk(e.target.files)} />
                </label>
              </div>
            )}
            <SaveBtn />
          </>
        )}

        {/* ── TAB: ESTATÍSTICAS ───────────────────────────────────── */}
        {activeTab === "estatisticas" && (
          <>
            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "#101828" }}>📊 Estatísticas do Evento</div>
              <p style={{ ...S.hint, marginBottom: "1rem" }}>Números exibidos nos cards e na página do evento</p>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Número de visitantes</label>
                  <input style={S.input} value={form.numVisitantes} onChange={(e) => set("numVisitantes", e.target.value)} placeholder="Ex: 50 mil, +80.000" />
                  <p style={S.hint}>Exibido como: "50 mil visitantes"</p>
                </div>
                <div>
                  <label style={S.label}>Número de expositores</label>
                  <input style={S.input} value={form.numExpositores} onChange={(e) => set("numExpositores", e.target.value)} placeholder="Ex: +200, +500" />
                  <p style={S.hint}>Exibido como: "+200 expositores"</p>
                </div>
              </div>
            </div>

            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem", color: "#101828" }}>🎫 Ingressos</div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Preço de entrada</label>
                  <input style={S.input} value={form.precoEntrada} onChange={(e) => set("precoEntrada", e.target.value)} placeholder="Ex: Gratuito, R$ 20,00" />
                  <p style={S.hint}>"Gratuito" exibe badge verde no app</p>
                </div>
                <div>
                  <label style={S.label}>Link para compra de ingressos</label>
                  <input style={S.input} value={form.ingressoUrl} onChange={(e) => set("ingressoUrl", e.target.value)} placeholder="https://..." />
                  <p style={S.hint}>URL para o botão "Comprar Ingresso"</p>
                </div>
              </div>
            </div>
            <SaveBtn />
          </>
        )}

        {/* ── TAB: CONTATO & REDES ────────────────────────────────── */}
        {activeTab === "contato" && (
          <>
            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem", color: "#101828" }}>📞 Contato do Organizador</div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>WhatsApp do organizador</label>
                  <input style={S.input} value={form.whatsappOrganizador} onChange={(e) => set("whatsappOrganizador", e.target.value)} placeholder="5566999999999" />
                  <p style={S.hint}>DDI+DDD+número (apenas números)</p>
                </div>
                <div>
                  <label style={S.label}>E-mail do organizador</label>
                  <input type="email" style={S.input} value={form.emailOrganizador} onChange={(e) => set("emailOrganizador", e.target.value)} placeholder="contato@evento.com.br" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label}>Site oficial</label>
                  <input style={S.input} value={form.siteOficial} onChange={(e) => set("siteOficial", e.target.value)} placeholder="https://www.evento.com.br" />
                </div>
              </div>
            </div>

            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "1rem", color: "#101828" }}>📱 Redes Sociais</div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Instagram</label>
                  <input style={S.input} value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/evento" />
                </div>
                <div>
                  <label style={S.label}>Facebook</label>
                  <input style={S.input} value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/evento" />
                </div>
                <div>
                  <label style={S.label}>YouTube</label>
                  <input style={S.input} value={form.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="https://youtube.com/@evento" />
                </div>
              </div>
            </div>
            <SaveBtn />
          </>
        )}

        {/* ── TAB: PROGRAMAÇÃO ────────────────────────────────────── */}
        {activeTab === "programacao" && (
          <>
            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "#101828" }}>🗓️ Grade de Programação</div>
              <p style={{ ...S.hint, marginBottom: "1rem" }}>Adicione shows, palestras, atividades e outros itens da programação</p>

              {form.programacao.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  {form.programacao.map((item, idx) => (
                    <div key={idx} style={{ background: "#f8f9fb", border: "1px solid #e4e7ec", borderRadius: 8, padding: "0.875rem", marginBottom: "0.5rem" }}>
                      {editingProgIdx === idx ? (
                        <div style={S.grid2}>
                          <div><label style={{ ...S.label, fontSize: "0.75rem" }}>Dia</label><input style={S.input} value={item.dia} onChange={(e) => editProg(idx, "dia", e.target.value)} placeholder="Ex: 10/03" /></div>
                          <div><label style={{ ...S.label, fontSize: "0.75rem" }}>Horário</label><input style={S.input} value={item.horario} onChange={(e) => editProg(idx, "horario", e.target.value)} placeholder="Ex: 09:00" /></div>
                          <div><label style={{ ...S.label, fontSize: "0.75rem" }}>Título / Atração *</label><input style={S.input} value={item.titulo} onChange={(e) => editProg(idx, "titulo", e.target.value)} placeholder="Ex: Abertura oficial" /></div>
                          <div><label style={{ ...S.label, fontSize: "0.75rem" }}>Local / Palco</label><input style={S.input} value={item.local} onChange={(e) => editProg(idx, "local", e.target.value)} placeholder="Ex: Palco Principal" /></div>
                          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.5rem" }}>
                            <button type="button" onClick={() => setEditingProgIdx(null)} style={{ padding: "0.35rem 0.75rem", background: "#12b76a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem" }}>✓ Concluir</button>
                            <button type="button" onClick={() => removeProg(idx)} style={{ padding: "0.35rem 0.75rem", background: "#f04438", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem" }}>Remover</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#101828", fontSize: "0.875rem" }}>{item.titulo}</div>
                            <div style={{ fontSize: "0.8125rem", color: "#667085", marginTop: "0.15rem" }}>{[item.dia, item.horario, item.local].filter(Boolean).join(" · ")}</div>
                          </div>
                          <div style={{ display: "flex", gap: "0.35rem" }}>
                            <button type="button" onClick={() => setEditingProgIdx(idx)} style={{ padding: "0.3rem 0.65rem", background: "#fff", color: "#344054", border: "1px solid #d0d5dd", borderRadius: 6, cursor: "pointer", fontSize: "0.8125rem" }}>Editar</button>
                            <button type="button" onClick={() => removeProg(idx)} style={{ padding: "0.3rem 0.65rem", background: "#fff", color: "#f04438", border: "1px solid #fecdca", borderRadius: 6, cursor: "pointer", fontSize: "0.8125rem" }}>Remover</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: "#fff", border: "2px dashed #d0d5dd", borderRadius: 8, padding: "1rem" }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#344054", marginBottom: "0.75rem" }}>➕ Adicionar item</div>
                <div style={S.grid2}>
                  <div><label style={{ ...S.label, fontSize: "0.75rem" }}>Dia</label><input style={S.input} value={novoProg.dia} onChange={(e) => setNovoProg((p) => ({ ...p, dia: e.target.value }))} placeholder="Ex: 10/03" /></div>
                  <div><label style={{ ...S.label, fontSize: "0.75rem" }}>Horário</label><input style={S.input} value={novoProg.horario} onChange={(e) => setNovoProg((p) => ({ ...p, horario: e.target.value }))} placeholder="Ex: 09:00" /></div>
                  <div><label style={{ ...S.label, fontSize: "0.75rem" }}>Título / Atração *</label><input style={S.input} value={novoProg.titulo} onChange={(e) => setNovoProg((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Show do Artista" /></div>
                  <div><label style={{ ...S.label, fontSize: "0.75rem" }}>Local / Palco</label><input style={S.input} value={novoProg.local} onChange={(e) => setNovoProg((p) => ({ ...p, local: e.target.value }))} placeholder="Ex: Palco Principal" /></div>
                </div>
                <button type="button" onClick={addProg} style={{ marginTop: "0.75rem", ...S.btnPrimary, fontSize: "0.875rem", padding: "0.5rem 1rem" }}>Adicionar</button>
              </div>
            </div>
            <SaveBtn />
          </>
        )}

        {/* ── TAB: EXPOSITOR ──────────────────────────────────────── */}
        {activeTab === "expositor" && (
          <>
            <div style={S.section}>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "#101828" }}>🏪 Botão "Quero ser expositor"</div>
              <p style={{ ...S.hint, marginBottom: "1rem" }}>
                Configura o botão exibido na página do evento. Ao clicar, o usuário é redirecionado para o WhatsApp ou link configurado.
              </p>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Tipo de contato</label>
                  <select style={S.input} value={form.expositorContatoTipo} onChange={(e) => set("expositorContatoTipo", e.target.value)}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="link">Link externo</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>{form.expositorContatoTipo === "whatsapp" ? "Número WhatsApp" : "URL do link"}</label>
                  <input style={S.input} value={form.expositorContato} onChange={(e) => set("expositorContato", e.target.value)} placeholder={form.expositorContatoTipo === "whatsapp" ? "5566999999999" : "https://..."} />
                  <p style={S.hint}>{form.expositorContatoTipo === "whatsapp" ? "DDI+DDD+número (apenas números)" : "URL completa para formulário ou página de inscrição"}</p>
                </div>
              </div>
            </div>
            <SaveBtn />
          </>
        )}

        {/* ── TAB: PESQUISA ───────────────────────────────────────── */}
        {activeTab === "pesquisa" && isEdit && (
          <div style={S.section}>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "#101828" }}>📝 Perguntas da Pesquisa Rápida</div>
            <p style={{ ...S.hint, marginBottom: "1rem" }}>
              Perguntas exibidas antes de acessar o mapa ou comentários. Se não houver perguntas, o app usa as padrão.
            </p>
            {loadingPerguntas ? (
              <p style={{ color: "#667085", fontSize: "0.875rem" }}>Carregando...</p>
            ) : (
              <>
                {questionarioPerguntas.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem 0" }}>
                    {questionarioPerguntas.map((p) => (
                      <li key={p.id} style={{ background: "#f8f9fb", border: "1px solid #e4e7ec", borderRadius: 8, padding: "0.875rem", marginBottom: "0.5rem" }}>
                        {editingPerguntaId === p.id ? (
                          <div>
                            <input type="text" defaultValue={p.pergunta} id={`ep-${p.id}`} placeholder="Texto da pergunta" style={{ ...S.input, marginBottom: "0.5rem" }} />
                            <textarea id={`eo-${p.id}`} defaultValue={opcoesToStr(p.opcoes)} placeholder="Uma opção por linha" rows={2} style={{ ...S.input, marginBottom: "0.5rem", resize: "vertical", minHeight: 60 }} />
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button type="button" style={{ padding: "0.35rem 0.75rem", background: "#12b76a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem" }} onClick={() => savePergunta(p.id, document.getElementById(`ep-${p.id}`)?.value, document.getElementById(`eo-${p.id}`)?.value)}>Salvar</button>
                              <button type="button" style={{ padding: "0.35rem 0.75rem", background: "#fff", color: "#344054", border: "1px solid #d0d5dd", borderRadius: 6, cursor: "pointer", fontSize: "0.8125rem" }} onClick={() => setEditingPerguntaId(null)}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div>
                              <strong style={{ fontSize: "0.875rem", color: "#101828" }}>{p.pergunta}</strong>
                              <div style={{ fontSize: "0.8125rem", color: "#667085", marginTop: "0.2rem" }}>{Array.isArray(p.opcoes) ? p.opcoes.join(" · ") : opcoesToStr(p.opcoes)}</div>
                            </div>
                            <div style={{ display: "flex", gap: "0.35rem" }}>
                              <button type="button" style={{ padding: "0.3rem 0.65rem", background: "#fff", color: "#344054", border: "1px solid #d0d5dd", borderRadius: 6, cursor: "pointer", fontSize: "0.8125rem" }} onClick={() => setEditingPerguntaId(p.id)}>Editar</button>
                              <button type="button" style={{ padding: "0.3rem 0.65rem", background: "#fff", color: "#f04438", border: "1px solid #fecdca", borderRadius: 6, cursor: "pointer", fontSize: "0.8125rem" }} onClick={() => deletePergunta(p.id)}>Excluir</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ background: "#fff", border: "2px dashed #d0d5dd", borderRadius: 8, padding: "1rem" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#344054", marginBottom: "0.75rem" }}>➕ Nova pergunta</div>
                  <input type="text" value={novaPergunta.pergunta} onChange={(e) => setNovaPergunta((p) => ({ ...p, pergunta: e.target.value }))} placeholder="Ex: Você é?" style={{ ...S.input, marginBottom: "0.5rem" }} />
                  <textarea value={novaPergunta.opcoes} onChange={(e) => setNovaPergunta((p) => ({ ...p, opcoes: e.target.value }))} placeholder={"Opções, uma por linha:\nVisitante\nEstudante\nExpositor"} rows={3} style={{ ...S.input, marginBottom: "0.5rem", resize: "vertical", minHeight: 70 }} />
                  <button type="button" onClick={addPergunta} style={{ ...S.btnPrimary, fontSize: "0.875rem", padding: "0.5rem 1rem" }}>Adicionar pergunta</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB: QR CODE ────────────────────────────────────────── */}
        {activeTab === "qrcode" && isEdit && (
          <QRCodeExport eventoId={id} eventoNome={form.nome} />
        )}

      </form>
    </div>
  );
}
